import { ServiceLinkerWebAppConfiguration } from '../../../models/service-linker';
import { CommonConstants } from '../../../utils/CommonConstants';
import Url from '../../../utils/url';
import { AppSettingsFormValues, FormAppSetting, FormConnectionString } from './AppSettings.types';

export const isServiceLinkerVisible = () => {
  return Url.getFeatureValue(CommonConstants.FeatureFlags.showServiceLinkerConnector);
};

export const isSettingServiceLinker = (settingName: string) => {
  return !!settingName && settingName.toLowerCase().startsWith(CommonConstants.AppSettingNames.serviceLinkerPrefix);
};

export const updateWebAppConfigForServiceLinker = (
  webAppConfig: ServiceLinkerWebAppConfiguration,
  initialValues: AppSettingsFormValues,
  setInitialValues: (values: AppSettingsFormValues | null) => void,
  setCurrentValues: (values: AppSettingsFormValues) => void,
  currentValues: AppSettingsFormValues
) => {
  // NOTE(krmitta): ServiceLinker blade returns all the associated settings.
  // Instead of comparing and adding only those which are new/updated, we first filter all the ServiceLinker settings,
  // And, then add the settings returned by ServiceLinker's blade.

  const serviceLinkerAppSettings: FormAppSetting[] = webAppConfig.appSettings || [];
  const serviceLinkerConnectionStrings: FormConnectionString[] = webAppConfig.connectionStrings || [];
  let filteredAppSettings = initialValues.appSettings.filter(appSetting =>
    appSetting.name.startsWith(CommonConstants.AppSettingNames.serviceLinkerPrefix)
  );
  let filteredConnectionStrings = initialValues.connectionStrings.filter(connStr =>
    connStr.name.startsWith(CommonConstants.AppSettingNames.serviceLinkerPrefix)
  );

  setInitialValues({
    ...initialValues,
    appSettings: [...filteredAppSettings, ...serviceLinkerAppSettings],
    connectionStrings: [...filteredConnectionStrings, ...serviceLinkerConnectionStrings],
  });

  filteredAppSettings = currentValues.appSettings.filter(appSetting =>
    appSetting.name.startsWith(CommonConstants.AppSettingNames.serviceLinkerPrefix)
  );
  filteredConnectionStrings = currentValues.connectionStrings.filter(connStr =>
    connStr.name.startsWith(CommonConstants.AppSettingNames.serviceLinkerPrefix)
  );
  setCurrentValues({
    ...currentValues,
    appSettings: [...currentValues.appSettings, ...serviceLinkerAppSettings],
    connectionStrings: [...currentValues.connectionStrings, ...serviceLinkerConnectionStrings],
  });
};
