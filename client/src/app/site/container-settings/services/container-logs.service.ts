import { Injectable, Injector } from '@angular/core';
import { CacheService } from '../../../shared/services/cache.service';
import { UserService } from '../../../shared/services/user.service';
import { ConditionalHttpClient, Result } from '../../../shared/conditional-http-client';
import { ResponseContentType } from '@angular/http';

export interface IContainerLogsService {
  getContainerLogs(resourceId: string): Result<string>;
}

@Injectable()
export class ContainerLogsService implements IContainerLogsService {
  private readonly _client: ConditionalHttpClient;

  constructor(private _cacheService: CacheService, userService: UserService, injector: Injector) {
    this._client = new ConditionalHttpClient(injector, _ => userService.getStartupInfo().map(i => i.token));
  }

  public getContainerLogs(resourceId: string, force: boolean = false): Result<any> {
    const requestResourceId = `${resourceId}/containerLogs`;

    const getContainerLogs = this._cacheService.postArm(requestResourceId, force).map(r => r, { type: 'application/octet-stream' });

    return this._client.execute({ resourceId: resourceId }, t => getContainerLogs);
  }

  public getContainerLogsAsZip(resourceId: string): Result<Blob> {
    const requestResourceId = `${resourceId}/containerLogs/zip/download`;

    const getContainerLogs = this._cacheService
      .postArm(requestResourceId, true, null, null, null, ResponseContentType.ArrayBuffer)
      .map(r => new Blob([r.arrayBuffer()], { type: 'application/zip' }));

    return this._client.execute({ resourceId: resourceId }, t => getContainerLogs);
  }
}
