import { Checkbox } from 'office-ui-fabric-react/lib/Checkbox';
import { Dropdown, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import * as React from 'react';
import { InjectedTranslateProps, translate } from 'react-i18next';

import ActionBar from '../../../../components/ActionBar';
import { formElementStyle } from '../AppSettings.styles';
import { FormConnectionString } from '../AppSettings.types';
import { DatabaseType, typeValueToString } from './connectionStringTypes';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib';

export interface ConnectionStringAddEditProps {
  updateConnectionString: (item: FormConnectionString) => any;
  closeBlade: () => void;
  otherConnectionStrings: FormConnectionString[];
  connectionString: FormConnectionString;
  disableSlotSetting: boolean;
}

const ConnectionStringsAddEdit: React.SFC<ConnectionStringAddEditProps & InjectedTranslateProps> = props => {
  const { updateConnectionString, otherConnectionStrings, t, closeBlade, connectionString, disableSlotSetting } = props;
  const [nameError, setNameError] = React.useState('');
  const [currentConnectionString, setCurrentConnectionString] = React.useState(connectionString);

  const validateConnectionStringName = (value: string) => {
    return otherConnectionStrings.filter(v => v.name === value).length >= 1 ? 'Connection string names must be unique' : '';
  };
  const updateConnectionStringName = (e: any, name: string) => {
    const error = validateConnectionStringName(name);
    setNameError(error);
    setCurrentConnectionString({ ...currentConnectionString, name });
  };

  const updateConnectionStringValue = (e: any, value: string) => {
    setCurrentConnectionString({ ...currentConnectionString, value });
  };

  const updateConnectionStringType = (e: any, typeOption: IDropdownOption) => {
    setCurrentConnectionString({ ...currentConnectionString, type: typeOption.key as number });
  };

  const updateConnectionStringSticky = (e: any, sticky: boolean) => {
    setCurrentConnectionString({ ...currentConnectionString, sticky });
  };

  const save = () => {
    updateConnectionString(currentConnectionString);
  };

  const cancel = () => {
    closeBlade();
  };

  const actionBarPrimaryButtonProps = {
    id: 'save',
    title: t('save'),
    onClick: save,
    disable: !!nameError,
  };

  const actionBarSecondaryButtonProps = {
    id: 'cancel',
    title: t('cancel'),
    onClick: cancel,
    disable: false,
  };

  return (
    <form>
      <TextField
        label={t('nameRes')}
        id="connection-strings-form-name"
        value={currentConnectionString.name}
        errorMessage={nameError}
        onChange={updateConnectionStringName}
        styles={{
          root: formElementStyle,
        }}
      />
      <TextField
        label={t('value')}
        id="connection-strings-form-value"
        value={currentConnectionString.value}
        onChange={updateConnectionStringValue}
        styles={{
          root: formElementStyle,
        }}
      />
      <Dropdown
        label={t('type')}
        id="connection-strings-form-type"
        selectedKey={currentConnectionString.type}
        options={[
          {
            key: DatabaseType.MySql,
            text: typeValueToString(DatabaseType.MySql),
          },
          {
            key: DatabaseType.SQLServer,
            text: typeValueToString(DatabaseType.SQLServer),
          },
          {
            key: DatabaseType.SQLAzure,
            text: typeValueToString(DatabaseType.SQLAzure),
          },
        ]}
        onChange={updateConnectionStringType}
        styles={{
          root: formElementStyle,
        }}
      />
      <Checkbox
        label={t('sticky')}
        id="connection-strings-form-sticky"
        defaultChecked={currentConnectionString.sticky}
        onChange={updateConnectionStringSticky}
        styles={{
          root: formElementStyle,
        }}
      />
      {disableSlotSetting && (
        <MessageBar messageBarType={MessageBarType.warning} isMultiline={true}>
          {t('slotSettingNoProdPermission')}
        </MessageBar>
      )}
      <ActionBar
        id="connection-string-edit-footer"
        primaryButton={actionBarPrimaryButtonProps}
        secondaryButton={actionBarSecondaryButtonProps}
      />
    </form>
  );
};

export default translate('translation')(ConnectionStringsAddEdit);
