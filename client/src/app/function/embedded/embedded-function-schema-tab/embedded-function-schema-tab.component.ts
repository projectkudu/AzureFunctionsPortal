import { SiteTabIds } from 'app/shared/models/constants';
import { CdsFunctionDescriptor } from 'app/shared/resourceDescriptors';
import { PortalResources } from 'app/shared/models/portal-resources';
import { TranslateService } from '@ngx-translate/core';
import { ErrorEvent } from 'app/shared/models/error-event';
import { errorIds } from 'app/shared/models/error-ids';
import { Observable } from 'rxjs/Observable';
import { HttpResult } from './../../../shared/models/http-result';
import { TextEditorComponent } from 'app/controls/text-editor/text-editor.component';
import { CacheService } from './../../../shared/services/cache.service';
import { BusyStateScopeManager } from './../../../busy-state/busy-state-scope-manager';
import { FunctionInfo } from 'app/shared/models/function-info';
import { TabComponent } from './../../../controls/tabs/tab/tab.component';
import { BroadcastEvent } from 'app/shared/models/broadcast-event';
import { Subject } from 'rxjs/Subject';
import { Component, ViewChild, Output, Input, OnChanges, SimpleChange, ContentChildren, QueryList, OnDestroy } from '@angular/core';
import { BroadcastService } from 'app/shared/services/broadcast.service';
import { FunctionSchemaEvent } from './../function-schema-event';

@Component({
  selector: 'embedded-function-schema-tab',
  templateUrl: './embedded-function-schema-tab.component.html',
  styleUrls: ['./embedded-function-schema-tab.component.scss']
})
export class EmbeddedFunctionSchemaTabComponent implements OnChanges, OnDestroy {
  @Input() resourceId: string;
  @Input() firstRun: boolean;
  @Output() onExpanded = new Subject<boolean>();
  @ViewChild(TextEditorComponent) textEditor: TextEditorComponent;

  @ContentChildren(TabComponent) tabs: QueryList<TabComponent>;

  public expanded = false;

  public responseOutputText = '';
  public initialRequestEditorContent = '';
  public initialResponseEditorContent = '';

  private _updatedRequestEditorContent = '';
  private _updatedResponseEditorContent = '';

  private _resourceIdStream = new Subject<string>();
  private _functionInfo: FunctionInfo;
  private _busyManager: BusyStateScopeManager;
  private _ngUnsubscribe = new Subject();

  constructor(
    private _cacheService: CacheService,
    private _broadcastService: BroadcastService,
    private _translateService: TranslateService) {

    this._busyManager = new BusyStateScopeManager(this._broadcastService, SiteTabIds.embeddedSchema);

    this._resourceIdStream
      .takeUntil(this._ngUnsubscribe)
      .distinctUntilChanged()
      .switchMap(resourceId => {
        this._busyManager.setBusy();
        return this._getFunction(resourceId);
      })
      .retry()
      .subscribe(r => {
        this._busyManager.clearBusy();

        if (!r.isSuccessful) {
          this._broadcastService.broadcast<ErrorEvent>(BroadcastEvent.Error, {
            message: r.error.message,
            errorId: r.error.errorId,
            resourceId: this.resourceId,
          });

          return;
        }

        this._functionInfo = r.result;

        try {
          const content = JSON.parse(this._functionInfo.test_data);
          this.initialRequestEditorContent = content.body ? JSON.stringify(content.body, null, '    ') : '';
        } catch (e) {
          this.initialRequestEditorContent = '';
        }

        this._updatedRequestEditorContent = this.initialRequestEditorContent;
        this._updatedResponseEditorContent = this.initialResponseEditorContent;

      });

      this._broadcastService.getEvents<FunctionSchemaEvent<void>>(BroadcastEvent.FunctionSchemaEvent)
      .takeUntil(this._ngUnsubscribe)
      .subscribe(r => {
        switch (r.type) {
          case 'saveSchema':
            this.saveSchema();
            break;
          default:
            break;
        }
      });
  }

  private _getFunction(resourceId: string) {
    return this._cacheService.getArm(resourceId, true)
      .map(r => {
        return <HttpResult<FunctionInfo>>{
          isSuccessful: true,
          error: null,
          result: r.json()
        };
      })
      .catch(e => {
        const descriptor = new CdsFunctionDescriptor(resourceId);
        return Observable.of(<HttpResult<FunctionInfo>>{
          isSuccessful: false,
          error: {
            errorId: errorIds.embeddedEditorLoadError,
            message: this._translateService.instant(PortalResources.error_unableToRetrieveFunction).format(descriptor.name)
          }
        });
      });
  }

  ngOnDestroy() {
    this._ngUnsubscribe.next();
  }

  ngOnChanges(changes: { [key: string]: SimpleChange }) {
    if (changes['resourceId']) {
      this._resourceIdStream.next(this.resourceId);
    }
  }

  editorRequestContentChanged(content: string) {
    this._updatedRequestEditorContent = content;
  }

  editorResponseContentChanged(content: string) {
    this._updatedResponseEditorContent = content;
  }

  saveSchema() {
    this.saveRequestSchemaContent();
    this.saveResponseSchemaContent();
  }

  saveRequestSchemaContent() {
    let requestSchema: string = this.resourceId + "/files/sampleRequest.json";
    this._busyManager.setBusy();;
    this._cacheService.putArm(requestSchema, null, this._updatedRequestEditorContent)
      .subscribe(r => {
        this._busyManager.clearBusy();
        this.initialRequestEditorContent = r.text();
        this._updatedRequestEditorContent = this.initialRequestEditorContent;
      }, err => {
        this._busyManager.clearBusy();
        this._broadcastService.broadcast<ErrorEvent>(BroadcastEvent.Error, {
          message: this._translateService.instant(PortalResources.error_unableToUpdateSwaggerData).format(this._functionInfo.name),
          errorId: errorIds.embeddedUpdateStatusError,
          resourceId: this.resourceId,
        });
      });
  }

  saveResponseSchemaContent() {
    let responseSchema: string = this.resourceId + "/files/sampleResponse.json";
    this._busyManager.setBusy();;
    this._cacheService.putArm(responseSchema, null, this._updatedResponseEditorContent)
      .subscribe(r => {
        this._busyManager.clearBusy();
        this.initialResponseEditorContent = r.text();
        this._updatedResponseEditorContent = this.initialResponseEditorContent;
      }, err => {
        this._busyManager.clearBusy();
        this._broadcastService.broadcast<ErrorEvent>(BroadcastEvent.Error, {
          message: this._translateService.instant(PortalResources.error_unableToUpdateSwaggerData).format(this._functionInfo.name),
          errorId: errorIds.embeddedUpdateStatusError,
          resourceId: this.resourceId,
        });
      });
  }
}
