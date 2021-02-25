import { Formik, FormikProps } from 'formik';
import React, { useContext, useRef, useState } from 'react';
import { AppSettingsFormValues, FormAppSetting, FormConnectionString } from './AppSettings.types';
import AppSettingsCommandBar from './AppSettingsCommandBar';
import AppSettingsDataLoader from './AppSettingsDataLoader';
import AppSettingsForm from './AppSettingsForm';
import { ScenarioIds } from '../../../utils/scenario-checker/scenario-ids';
import { useTranslation } from 'react-i18next';
import { ScenarioService } from '../../../utils/scenario-checker/scenario.service';
import i18n from 'i18next';
import { PermissionsContext, SiteContext } from './Contexts';
import { commandBarSticky, formStyle } from './AppSettings.styles';
import UpsellBanner from '../../../components/UpsellBanner/UpsellBanner';
import { ArmObj } from '../../../models/arm-obj';
import { Site } from '../../../models/site/site';
import { MessageBarType } from 'office-ui-fabric-react';
import ConfirmDialog from '../../../components/ConfirmDialog/ConfirmDialog';
import CustomBanner from '../../../components/CustomBanner/CustomBanner';
import { CreateServiceLinkerResponse, ServiceLinkerWebAppConfiguration } from '../../../models/service-linker';
import { PortalContext } from '../../../PortalContext';

const validate = (values: AppSettingsFormValues | null, t: i18n.TFunction, scenarioChecker: ScenarioService, site: ArmObj<Site>) => {
  if (!values) {
    return {};
  }

  const duplicateDefaultDocumentsValidation = (value: string) => {
    return values.config.properties.defaultDocuments.filter(v => v === value).length > 1 ? t('fieldMustBeUnique') : null;
  };
  const hasDuplicates = array => {
    return new Set(array).size !== array.length;
  };
  const isJavaApp = values.currentlySelectedStack === 'java';
  const defaultDocumentsEnabled =
    scenarioChecker.checkScenario(ScenarioIds.defaultDocumentsSupported, { site: values.site }).status !== 'disabled';
  let hasAnyError = false;
  const errors = {
    config: {
      properties: {} as any,
    },
  };
  if (scenarioChecker.checkScenario(ScenarioIds.skipStackValidation, { site }).status !== 'disabled') {
    if (isJavaApp && !values.config.properties.javaContainer) {
      hasAnyError = true;
      errors.config.properties.javaContainer = 'required';
    }
    if (isJavaApp && !values.config.properties.javaContainerVersion) {
      hasAnyError = true;
      errors.config.properties.javaContainerVersion = 'required';
    }
    if (isJavaApp && !values.config.properties.javaVersion) {
      hasAnyError = true;
      errors.config.properties.javaVersion = 'required';
    }
  }
  if (defaultDocumentsEnabled && hasDuplicates(values.config.properties.defaultDocuments)) {
    hasAnyError = true;
    errors.config.properties.defaultDocuments = values.config.properties.defaultDocuments.map(value => {
      return duplicateDefaultDocumentsValidation(value);
    });
  }

  return hasAnyError ? errors : {};
};

interface AppSettingsProps {
  resourceId: string;
}

const AppSettings: React.FC<AppSettingsProps> = props => {
  const { resourceId } = props;
  const { t } = useTranslation();
  const scenarioCheckerRef = useRef(new ScenarioService(t));
  const scenarioChecker = scenarioCheckerRef.current!;
  const [showRefreshConfirmDialog, setShowRefreshConfirmDialog] = useState(false);
  const [showSaveConfirmDialog, setShowSaveConfirmDialog] = useState(false);

  const portalContext = useContext(PortalContext);

  const closeRefreshConfirmDialog = () => {
    setShowRefreshConfirmDialog(false);
  };

  const closeSaveConfirmDialog = () => {
    setShowSaveConfirmDialog(false);
  };

  const onResourceConnectionClick = async (
    initialValues: AppSettingsFormValues | null,
    setInitialValues: (values: AppSettingsFormValues | null) => void,
    currentValues: AppSettingsFormValues,
    setCurrentValues: (values: AppSettingsFormValues) => void
  ) => {
    const response = await portalContext.openBlade<CreateServiceLinkerResponse>(
      {
        detailBlade: 'CreateLinkerBlade',
        detailBladeInputs: {
          sourceResourceId: resourceId,
        },
        extension: 'ServiceLinkerExtension',
        openAsContextBlade: true,
      },
      'service-linker'
    );
    if (!!response && !!response.data && response.data.value.isSucceeded) {
      const webAppConfig = response.data.value.webAppConfiguration;
      if (!!webAppConfig && !!initialValues) {
        updateWebAppConfigForServiceLinker(webAppConfig, initialValues, setInitialValues, setCurrentValues, currentValues);
      }
    }
  };

  const updateWebAppConfigForServiceLinker = (
    webAppConfig: ServiceLinkerWebAppConfiguration,
    initialValues: AppSettingsFormValues,
    setInitialValues: (values: AppSettingsFormValues | null) => void,
    setCurrentValues: (values: AppSettingsFormValues) => void,
    currentValues: AppSettingsFormValues
  ) => {
    const serviceLinkerAppSettings: FormAppSetting[] = webAppConfig.appSettings || [];
    const serviceLinkerConnectionStrings: FormConnectionString[] = webAppConfig.connectionStrings || [];
    setInitialValues({
      ...initialValues,
      appSettings: [...initialValues.appSettings, ...serviceLinkerAppSettings],
      connectionStrings: [...initialValues.connectionStrings, ...serviceLinkerConnectionStrings],
    });
    setCurrentValues({
      ...currentValues,
      appSettings: [...currentValues.appSettings, ...serviceLinkerAppSettings],
      connectionStrings: [...currentValues.connectionStrings, ...serviceLinkerConnectionStrings],
    });
  };

  return (
    <AppSettingsDataLoader resourceId={resourceId}>
      {({ initialFormValues, onSubmit, scaleUpPlan, refreshAppSettings, setInitialValues, asyncData }) => (
        <PermissionsContext.Consumer>
          {permissions => {
            return (
              <SiteContext.Consumer>
                {site => {
                  return (
                    <Formik
                      initialValues={initialFormValues}
                      onSubmit={onSubmit}
                      enableReinitialize={true}
                      validate={values => validate(values, t, scenarioChecker, site)}
                      validateOnBlur={false}
                      validateOnChange={false}>
                      {(formProps: FormikProps<AppSettingsFormValues>) => (
                        <form
                          onSubmit={e => {
                            e.preventDefault();
                          }}>
                          <div className={commandBarSticky}>
                            <AppSettingsCommandBar
                              onSave={() => setShowSaveConfirmDialog(true)}
                              resetForm={formProps.resetForm}
                              refreshAppSettings={() => setShowRefreshConfirmDialog(true)}
                              disabled={permissions.saving}
                              dirty={formProps.dirty}
                              onResourceConnectionClick={() =>
                                onResourceConnectionClick(initialFormValues, setInitialValues, formProps.values, formProps.setValues)
                              }
                            />
                            <ConfirmDialog
                              primaryActionButton={{
                                title: t('continue'),
                                onClick: () => {
                                  closeRefreshConfirmDialog();
                                  refreshAppSettings();
                                },
                              }}
                              defaultActionButton={{
                                title: t('cancel'),
                                onClick: closeRefreshConfirmDialog,
                              }}
                              title={t('refreshAppSettingsTitle')}
                              content={t('refreshAppSettingsMessage')}
                              hidden={!showRefreshConfirmDialog}
                              onDismiss={closeRefreshConfirmDialog}
                            />
                            <ConfirmDialog
                              primaryActionButton={{
                                title: t('continue'),
                                onClick: () => {
                                  closeSaveConfirmDialog();
                                  formProps.submitForm();
                                },
                              }}
                              defaultActionButton={{
                                title: t('cancel'),
                                onClick: closeSaveConfirmDialog,
                              }}
                              title={t('saveAppSettingsTitle')}
                              content={t('saveAppSettingsMessage')}
                              hidden={!showSaveConfirmDialog}
                              onDismiss={closeSaveConfirmDialog}
                            />

                            {!!initialFormValues &&
                              scenarioChecker.checkScenario(ScenarioIds.showAppSettingsUpsell, { site }).status === 'enabled' && (
                                <UpsellBanner onClick={scaleUpPlan} />
                              )}
                            {!!initialFormValues && initialFormValues.references && !initialFormValues.references.appSettings && (
                              <CustomBanner
                                id="appSettings-keyvault-error"
                                message={t('appSettingKeyvaultAPIError')}
                                type={MessageBarType.error}
                              />
                            )}
                          </div>
                          {!!initialFormValues ? (
                            <div className={formStyle}>
                              <AppSettingsForm asyncData={asyncData} {...formProps} />
                            </div>
                          ) : (
                            <CustomBanner message={t('configLoadFailure')} type={MessageBarType.error} />
                          )}
                        </form>
                      )}
                    </Formik>
                  );
                }}
              </SiteContext.Consumer>
            );
          }}
        </PermissionsContext.Consumer>
      )}
    </AppSettingsDataLoader>
  );
};

export default AppSettings;
