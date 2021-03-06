import MakeArmCall from '../ArmHelper';
import { ArmObj } from '../../models/arm-obj';
import { StaticSite } from '../../models/static-site/static-site';
import { CommonConstants } from '../../utils/CommonConstants';
import { sendHttpRequest } from '../HttpClient';
import { getArmToken } from '../../pages/app/deployment-center/utility/DeploymentCenterUtility';
import { StaticSiteBillingMeter, StaticSiteBillingType } from '../../pages/static-app/skupicker/StaticSiteSkuPicker.types';
export default class StaticSiteService {
  public static getStaticSite = (resourceId: string) => {
    return MakeArmCall<ArmObj<StaticSite>>({
      resourceId,
      commandName: 'getStaticSite',
      apiVersion: CommonConstants.ApiVersions.staticSitePreviewApiVersion20191201,
    });
  };

  public static putStaticSite = (resourceId: string, body: any) => {
    return MakeArmCall<ArmObj<StaticSite>>({
      resourceId,
      method: 'PUT',
      commandName: 'putStaticSite',
      body: body,
      apiVersion: CommonConstants.ApiVersions.staticSitePreviewApiVersion20191201,
    });
  };

  public static patchStaticSite = (resourceId: string, body: any) => {
    return MakeArmCall<ArmObj<StaticSite>>({
      resourceId,
      method: 'PATCH',
      commandName: 'patchStaticSite',
      body: body,
      apiVersion: CommonConstants.ApiVersions.staticSiteApiVersion20201201,
    });
  };

  public static getStaticSiteBillingMeters = (
    subscriptionId: string,
    apiVersion = CommonConstants.ApiVersions.billingApiVersion20190114
  ) => {
    const url = `${CommonConstants.serviceBmxUrl}/api/Billing/Subscription/GetSpecsCosts?api-version=${apiVersion}`;

    const data = {
      subscriptionId: subscriptionId,
      specResourceSets: [
        {
          id: StaticSiteBillingType.SWAMonthly,
          firstParty: [
            {
              id: StaticSiteBillingType.SWAMonthly,
              quantity: 1,
              resourceId: '56c80fab-f20c-5e41-951d-667dc9503604',
            },
          ],
        },
        {
          id: StaticSiteBillingType.SWAIncremental,
          firstParty: [
            {
              id: StaticSiteBillingType.SWAIncremental,
              quantity: 1,
              resourceId: '0ecf6c02-a907-5918-8591-4f912eb59a31',
            },
          ],
        },
      ],
      specsToAllowZeroCost: ['F1'],
      specType: 'WebsitesExtension',
      IsRpcCall: true,
    };

    const headers = {
      Authorization: getArmToken(),
    };

    return sendHttpRequest<StaticSiteBillingMeter>({ url, method: 'POST', data, headers }, true /* excludeWellKnownHeaders */);
  };
}
