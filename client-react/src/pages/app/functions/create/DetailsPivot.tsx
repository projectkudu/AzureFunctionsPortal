import React, { useContext, useState } from 'react';
import { FunctionTemplate } from '../../../../models/functions/function-template';
import { DefaultButton, Spinner } from 'office-ui-fabric-react';
import { useTranslation } from 'react-i18next';
import { Formik, FormikProps } from 'formik';
import { Binding } from '../../../../models/functions/binding';
import { CreateFunctionFormBuilder, CreateFunctionFormValues } from '../common/CreateFunctionFormBuilder';
import { FunctionInfo } from '../../../../models/functions/function-info';
import { ArmObj } from '../../../../models/arm-obj';
import { detailsPaddingStyle } from './FunctionCreate.styles';
import { FunctionCreateContext } from './FunctionCreateDataLoader';
import { PortalContext } from '../../../../PortalContext';
import LoadingComponent from '../../../../components/Loading/LoadingComponent';

interface DetailsPivotProps {
  functionsInfo: ArmObj<FunctionInfo>[] | undefined;
  bindings: Binding[] | undefined;
  selectedFunctionTemplate: FunctionTemplate | undefined;
  resourceId: string;
}

const DetailsPivot: React.FC<DetailsPivotProps> = props => {
  const { functionsInfo, bindings, selectedFunctionTemplate, resourceId } = props;
  const provider = useContext(FunctionCreateContext);
  const portalCommunicator = useContext(PortalContext);
  const { t } = useTranslation();
  const [creatingFunction, setCreatingFunction] = useState<boolean>(false);

  if (selectedFunctionTemplate) {
    if (!functionsInfo || !bindings) {
      return <LoadingComponent />;
    }
    const requiredBindings =
      selectedFunctionTemplate.userPrompt && selectedFunctionTemplate.userPrompt.length > 0
        ? getRequiredCreationBindings(bindings, selectedFunctionTemplate.userPrompt)
        : [];
    const builder = new CreateFunctionFormBuilder(
      selectedFunctionTemplate.bindings || [],
      requiredBindings,
      resourceId,
      functionsInfo,
      selectedFunctionTemplate.defaultFunctionName || 'NewFunction',
      t
    );
    const initialFormValues = builder.getInitialFormValues();

    return (
      <>
        <Formik
          initialValues={initialFormValues}
          isInitialValid={true} // Using deprecated option to allow pristine values to be valid.
          onSubmit={formValues => {
            setCreatingFunction(true);
            provider.createFunction(portalCommunicator, t, resourceId, selectedFunctionTemplate, formValues);
          }}>
          {(formProps: FormikProps<CreateFunctionFormValues>) => {
            return (
              <form>
                <div style={detailsPaddingStyle}>
                  {builder.getFields(formProps, false)}
                  <DefaultButton onClick={formProps.submitForm} disabled={!formProps.isValid || creatingFunction}>
                    {creatingFunction ? <Spinner /> : t('functionCreate_createFunction')}
                  </DefaultButton>
                </div>
              </form>
            );
          }}
        </Formik>
      </>
    );
  }
  return <p>{t('functionCreate_selectTemplate')}</p>;
};

// Not all bindings are required for function creation
// Only display bindings that are list in the function template 'userPrompt'
const getRequiredCreationBindings = (bindings: Binding[], userPrompt: string[]): Binding[] => {
  const requiredBindings: Binding[] = [];
  bindings.forEach(binding => {
    const requiredBinding = binding;
    requiredBinding.settings =
      binding.settings &&
      binding.settings.filter(setting => {
        return userPrompt.find(prompt => prompt === setting.name);
      });
    requiredBindings.push(requiredBinding);
  });
  return requiredBindings;
};

export default DetailsPivot;
