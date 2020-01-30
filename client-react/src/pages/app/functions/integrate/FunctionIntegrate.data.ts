import FunctionsService from '../../../../ApiHelpers/FunctionsService';
import { HttpResponseObject } from '../../../../ArmHelper.types';
import { ArmObj } from '../../../../models/arm-obj';
import { Binding } from '../../../../models/functions/binding';
import { FunctionInfo } from '../../../../models/functions/function-info';
import SiteService from '../../../../ApiHelpers/SiteService';

export default class FunctionIntegrateData {
  public getBindings(functionAppResourceId: string): Promise<HttpResponseObject<ArmObj<Binding[]>>> {
    return FunctionsService.getBindings(functionAppResourceId);
  }

  public getBinding(functionAppResourceId: string, bindingId: string): Promise<HttpResponseObject<ArmObj<Binding>>> {
    return FunctionsService.getBinding(functionAppResourceId, bindingId);
  }

  public getFunctionAppApplicationSettings(functionAppResourceId: string): Promise<HttpResponseObject<ArmObj<{ [key: string]: string }>>> {
    return SiteService.fetchApplicationSettings(functionAppResourceId);
  }

  public getFunction(functionResourceId: string): Promise<HttpResponseObject<ArmObj<FunctionInfo>>> {
    return FunctionsService.getFunction(functionResourceId);
  }

  public updateFunction(functionResourceId: string, functionInfo: ArmObj<FunctionInfo>): Promise<HttpResponseObject<ArmObj<FunctionInfo>>> {
    return FunctionsService.updateFunction(functionResourceId, functionInfo);
  }
}
