import { Component, Input, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { Subscription as RxSubscription } from 'rxjs/Subscription';
import { TranslateService } from '@ngx-translate/core';

import { PortalResources } from './../../shared/models/portal-resources';
import { BusyStateComponent } from './../../busy-state/busy-state.component';
import { BusyStateScopeManager } from './../../busy-state/busy-state-scope-manager';
import { TabsComponent } from './../../tabs/tabs.component';
import { TreeViewInfo, SiteData } from './../../tree-view/models/tree-view-info';
import { GeneralSettingsComponent } from './general-settings/general-settings.component';
import { AppSettingsComponent } from './app-settings/app-settings.component';
import { ConnectionStringsComponent } from './connection-strings/connection-strings.component';
import { PortalService } from './../../shared/services/portal.service';
import { AuthzService } from './../../shared/services/authz.service';
import { AiService } from './../../shared/services/ai.service';

export interface SaveResult {
  success: boolean;
  errors?: string[];
}

@Component({
  selector: 'site-config',
  templateUrl: './site-config.component.html',
  styleUrls: ['./site-config.component.scss']
})
export class SiteConfigComponent implements OnDestroy {
  public viewInfoStream: Subject<TreeViewInfo<SiteData>>;
  private _viewInfoSubscription: RxSubscription;
  private _writePermission: boolean = true;
  private _readOnlyLock: boolean = false;
  public hasWritePermissions: boolean = true;

  public mainForm: FormGroup;
  private resourceId: string;

  private _busyState: BusyStateComponent;
  private _busyStateScopeManager: BusyStateScopeManager;

  @Input() set viewInfoInput(viewInfo: TreeViewInfo<SiteData>) {
    this.viewInfoStream.next(viewInfo);
  }

  @ViewChild(GeneralSettingsComponent) generalSettings: GeneralSettingsComponent;
  @ViewChild(AppSettingsComponent) appSettings: AppSettingsComponent;
  @ViewChild(ConnectionStringsComponent) connectionStrings: ConnectionStringsComponent;

  constructor(
    private _fb: FormBuilder,
    private _translateService: TranslateService,
    private _portalService: PortalService,
    private _aiService: AiService,
    private _authZService: AuthzService,
    tabsComponent: TabsComponent
  ) {
    this._busyState = tabsComponent.busyState;
    this._busyStateScopeManager = this._busyState.getScopeManager();

    this.viewInfoStream = new Subject<TreeViewInfo<SiteData>>();
    this._viewInfoSubscription = this.viewInfoStream
      .distinctUntilChanged()
      .switchMap(viewInfo => {
        this._busyStateScopeManager.setBusy();
        return Observable.zip(
          Observable.of(viewInfo.resourceId),
          this._authZService.hasPermission(viewInfo.resourceId, [AuthzService.writeScope]),
          this._authZService.hasReadOnlyLock(viewInfo.resourceId),
          (r, wp, rl) => ({ resourceId: r, writePermission: wp, readOnlyLock: rl })
        )
      })
      .do(null, error => {
        this.resourceId = null;
        this.mainForm = this._fb.group({});
        this._aiService.trackEvent("/errors/site-config", error);
        this._busyStateScopeManager.clearBusy();
      })
      .retry()
      .subscribe(r => {
        this._writePermission = r.writePermission;
        this._readOnlyLock = r.readOnlyLock;
        this.hasWritePermissions = r.writePermission && !r.readOnlyLock;
        this.resourceId = r.resourceId;
        this.mainForm = this._fb.group({});
        this._busyStateScopeManager.clearBusy();
      });
  }

  ngOnDestroy(): void {
    if (this._viewInfoSubscription) { this._viewInfoSubscription.unsubscribe(); this._viewInfoSubscription = null; }
    this._busyStateScopeManager.dispose();
  }

  save() {
    this.generalSettings.validate();
    this.appSettings.validate();
    this.connectionStrings.validate();

    this._busyStateScopeManager.setBusy();
    let notificationId = null;
    this._portalService.startNotification(
      this._translateService.instant(PortalResources.configUpdating),
      this._translateService.instant(PortalResources.configUpdating))
      .first()
      .switchMap(s => {
        notificationId = s.id;
        return Observable.zip(
          this.generalSettings.save(),
          this.appSettings.save(),
          this.connectionStrings.save(),
          (g, a, c) => ({ generalSettingsResult: g, appSettingsResult: a, connectionStringsResult: c })
        )
      })
      .subscribe(r => {
        this._busyStateScopeManager.clearBusy();
        this.mainForm = this._fb.group({});

        let saveFailures: string[] = [];
        let saveSuccess: boolean = true;

        [r.generalSettingsResult, r.appSettingsResult, r.connectionStringsResult].forEach(result => {
          if (!result.success) {
            saveSuccess = false;
            if (!!result.errors) {
              saveFailures = saveFailures.concat(result.errors);
            }
          }
        })
        
        let saveNotification = saveSuccess ?
          this._translateService.instant(PortalResources.configUpdateSuccess) :
          this._translateService.instant(PortalResources.configUpdateFailure) + JSON.stringify(saveFailures);

        if (!saveSuccess) {
          this.mainForm.markAsDirty();
        }

        this._portalService.stopNotification(notificationId, saveSuccess, saveNotification);
      });
  }

  discard() {
    this.mainForm = this._fb.group({});
  }
}
