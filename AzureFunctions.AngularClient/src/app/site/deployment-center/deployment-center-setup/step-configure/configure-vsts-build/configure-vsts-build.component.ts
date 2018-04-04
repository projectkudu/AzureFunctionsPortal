import { Component, OnDestroy } from '@angular/core';
import { SelectOption } from '../../../../../shared/models/select-option';
import { DeploymentCenterStateManager } from '../../wizard-logic/deployment-center-state-manager';
import { Subject } from 'rxjs/Subject';
import { UserService } from '../../../../../shared/services/user.service';
import { CacheService } from '../../../../../shared/services/cache.service';
import { Observable } from 'rxjs/Observable';
import { VSOAccount, VsoProject } from '../../../Models/vso-repo';
import { Headers } from '@angular/http';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { DropDownElement } from '../../../../../shared/models/drop-down-element';
import { LogService } from '../../../../../shared/services/log.service';
import { LogCategories, DeploymentCenterConstants } from '../../../../../shared/models/constants';
import { TranslateService } from '@ngx-translate/core';
import { RequiredValidator } from '../../../../../shared/validators/requiredValidator';

export const TaskRunner = {
  None: 'None',
  Gulp: 'Gulp',
  Grunt: 'Grunt'
};

export const WebAppFramework = {
  AspNetWap: 'AspNetWap',
  AspNetCore: 'AspNetCore',
  Node: 'Node',
  PHP: 'PHP',
  Python: 'Python',
  StaticWebapp: 'StaticWebapp'
};

export class VSTSRepository {
  name: string;
  account: string;
  remoteUrl: string;
  projectName: string;
  id: string;
}

@Component({
  selector: 'app-configure-vsts-build',
  templateUrl: './configure-vsts-build.component.html',
  styleUrls: ['./configure-vsts-build.component.scss', '../step-configure.component.scss', '../../deployment-center-setup.component.scss']
})
export class ConfigureVstsBuildComponent implements OnDestroy {

  nodeJsTaskRunners: DropDownElement<string>[] = [
    { value: 'gulp', displayLabel: 'Gulp' },
    { value: 'grunt', displayLabel: 'Grunt' },
    { value: 'none', displayLabel: 'None' },
  ];

  recommendedPythonVersion = 'python353x86';
  pythonVersionList: DropDownElement<string>[] = [
    { value: 'python2712x64', displayLabel: 'Python 2.7.12 x64' },
    { value: 'python2712x86', displayLabel: 'Python 2.7.12 x86' },
    { value: 'python2713x64', displayLabel: 'Python 2.7.13 x64' },
    { value: 'python2713x86', displayLabel: 'Python 2.7.13 x86' },
    { value: 'python353x64', displayLabel: 'Python 3.5.3 x64' },
    { value: 'python353x86', displayLabel: 'Python 3.5.3 x86' }, // Recommended version
    { value: 'python360x86', displayLabel: 'Python 3.6.0 x86' },
    { value: 'python360x64', displayLabel: 'Python 3.6.0 x64' },
    { value: 'python361x86', displayLabel: 'Python 3.6.1 x86' },
    { value: 'python361x64', displayLabel: 'Python 3.6.1 x64' }
  ];

  pythonFrameworkList: DropDownElement<string>[] = [
    { value: 'Bottle', displayLabel: 'Bottle' },
    { value: 'Django', displayLabel: 'Django' },
    { value: 'Flask', displayLabel: 'Flask' }
  ];

  WebApplicationFrameworks: DropDownElement<string>[] = [
    {
      displayLabel: 'ASP.NET',
      value: WebAppFramework.AspNetWap
    },
    {
      displayLabel: 'ASP.NET Core',
      value: WebAppFramework.AspNetCore
    },
    {
      displayLabel: 'Node.JS',
      value: WebAppFramework.Node
    },
    {
      displayLabel: 'PHP',
      value: WebAppFramework.PHP
    },
    {
      displayLabel: 'Python',
      value: WebAppFramework.Python
    },
    {
      displayLabel: 'Static Webapp',
      value: WebAppFramework.StaticWebapp
    }
  ];

  private token: string;
  public NewVsoAccountOptions: SelectOption<boolean>[];
  private _ngUnsubscribe = new Subject();

  public vstsRegionList = [];
  public AccountList: DropDownElement<string>[];
  public ProjectList: DropDownElement<string>[];
  public LocationList: DropDownElement<string>[];

  private vsoAccountToProjectMap: { [key: string]: DropDownElement<string>[] } = {};

  selectedAccount = '';
  selectedProject = '';
  selectedLocation = '';
  selectedFramework = WebAppFramework.AspNetWap;
  selectedPythonVersion = this.recommendedPythonVersion;
  selectedPythonFramework = 'Bottle';
  selectedTaskRunner = 'none';

  constructor(
    private _translateService: TranslateService,
    private _cacheService: CacheService,
    public wizard: DeploymentCenterStateManager,
    private _userService: UserService,
    private _logService: LogService
  ) {
    this._userService.getStartupInfo().takeUntil(this._ngUnsubscribe).subscribe(r => {
      this.token = r.token;
    });

    this.NewVsoAccountOptions =
      [{ displayLabel: 'New', value: true },
      { displayLabel: 'Existing', value: false }];

    this.setupSubscriptions();
    const val = this.wizard.wizardValues;
    val.buildSettings.createNewVsoAccount = false;
    this.wizard.wizardValues = val;
    this.setUpformValidators();
  }

  private setUpformValidators() {
    const required = new RequiredValidator(this._translateService, false);
    this.wizard.buildSettings.get('createNewVsoAccount').setValidators(required.validate.bind(required));
    this.wizard.buildSettings.get('createNewVsoAccount').updateValueAndValidity();
    this.wizard.buildSettings.get('vstsAccount').setValidators(required.validate.bind(required));
    this.wizard.buildSettings.get('vstsAccount').updateValueAndValidity();

    if (this.wizard.wizardValues.buildSettings.createNewVsoAccount) {
      this.wizard.buildSettings.get('location').setValidators(required.validate.bind(required));
      this.wizard.buildSettings.get('vstsProject').setValidators([]);
    } else {
      this.wizard.buildSettings.get('location').setValidators([]);

      this.wizard.buildSettings.get('vstsProject').setValidators(required.validate.bind(required));
    }
    this.wizard.buildSettings.get('vstsProject').updateValueAndValidity();
    this.wizard.buildSettings.get('location').updateValueAndValidity();
  }

  private removeFormValidators() {
    this.wizard.buildSettings.get('createNewVsoAccount').setValidators([]);
    this.wizard.buildSettings.get('vstsAccount').setValidators([]);
    this.wizard.buildSettings.get('vstsProject').setValidators([]);
    this.wizard.buildSettings.get('location').setValidators([]);
    this.wizard.buildSettings.get('createNewVsoAccount').updateValueAndValidity();
    this.wizard.buildSettings.get('vstsAccount').updateValueAndValidity();
    this.wizard.buildSettings.get('vstsProject').updateValueAndValidity();
    this.wizard.buildSettings.get('location').updateValueAndValidity();
  }

  private setupSubscriptions() {
    this._cacheService.get(DeploymentCenterConstants.vstsProfileUri)
      .map(r => r.json())
      .switchMap(r => this.fetchAccounts(r.id))
      .switchMap(r => {
        this.AccountList =
          r.map(account => {
            return {
              displayLabel: account.accountName,
              value: account.accountName
            };
          });
        const projectCalls: Observable<{ account: string, projects: VsoProject[] }>[] = [];
        r.forEach(account => {
          projectCalls.push(
            this._cacheService
              .get(DeploymentCenterConstants.vstsProjectsApi.format(account.accountName), true, this.getHeaders())
              .map(res => {
                return {
                  account: account.accountName,
                  projects: res.json().value
                };
              }));
        });
        return forkJoin(projectCalls);
      })
      .subscribe(
        r => {
          this.vsoAccountToProjectMap = {};
          r.forEach(projectList => {
            this.vsoAccountToProjectMap[projectList.account] = projectList.projects.map(project => {
              return {
                displayLabel: project.name,
                value: project.name
              };
            });
          });

        },
        err => {
          this._logService.error(LogCategories.cicd, '/fetch-vso-profile-repo-data', err);
        }
      );

    this._cacheService.get(DeploymentCenterConstants.vstsRegionsApi, true, this.getHeaders())
      .subscribe(r => {
        const locationArray: any[] = r.json().value;
        this.LocationList = locationArray.map(v => {
          return {
            displayLabel: v.displayName,
            value: v.regionCode
          };
        });
      },
        err => {
          this._logService.error(LogCategories.cicd, '/fetch-vso-available-locations', err);
        });
  }

  private fetchAccounts(memberId: string): Observable<VSOAccount[]> {
    const accountsUrl = DeploymentCenterConstants.vstsAccountsFetchUri.format(memberId);
    return this._cacheService.get(accountsUrl, true, this.getHeaders()).switchMap(r => {
      const accounts = r.json().value as VSOAccount[];
      if (this.wizard.wizardForm.controls.buildProvider.value === 'kudu') {
        return Observable.of(accounts.filter(x => x.isAccountOwner));
      } else {
        return Observable.of(accounts);
      }
    });
  }

  get getFramework() {
    return this.selectedPythonFramework;
  }

  createOrExistingChanged(event) {
    this.setUpformValidators();
  }
  accountChanged(accountName: DropDownElement<string>) {
    this.ProjectList = this.vsoAccountToProjectMap[accountName.value];
    this.selectedProject = '';
  }

  private getHeaders(): Headers {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Accept', 'application/json');
    headers.append('Authorization', `Bearer ${this.token}`);
    headers.append('X-VSS-ForceMsaPassThrough', 'true');
    return headers;
  }
  ngOnDestroy(): void {
    this._ngUnsubscribe.next();
    this.removeFormValidators();
  }
}
