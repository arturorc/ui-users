import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import { Button, Callout, Col, ConfirmationModal, Modal, Pane, Paneset, Row, MultiSelection } from '@folio/stripes-components';
import { Field } from 'redux-form';
import SafeHTMLMessage from '@folio/react-intl-safe-html';
import EditableList from '@folio/stripes-smart-components/lib/EditableList';

import { validate } from '../util';

class OwnerSettings extends React.Component {
  static manifest = Object.freeze({
    owners: {
      type: 'okapi',
      path: 'owners',
      records: 'owners',
      accumulate: 'true',
      throwErrors: false,
      PUT: {
        path: 'owners/%{activeRecord.id}',
      },
      DELETE: {
        path: 'owners/%{activeRecord.id}',
      },
      GET: {
        path: 'owners?query=cql.allRecords=1 &limit=500'
      }
    },
    servicePoints: {
      type: 'okapi',
      resource: 'service-points',
      path: 'service-points',
    },
    activeRecord: {},
  });

  constructor(props) {
    super(props);

    this.state = {
      showConfirmDialog: false,
      showItemInUseDialog: false,
      selectedItem: {},
      primaryField: 'owner',
    };

    this.validate = this.validate.bind(this);
    this.onCreateItem = this.onCreateItem.bind(this);
    this.onUpdateItem = this.onUpdateItem.bind(this);
    this.onDeleteItem = this.onDeleteItem.bind(this);
    this.showConfirmDialog = this.showConfirmDialog.bind(this);
    this.hideConfirmDialog = this.hideConfirmDialog.bind(this);
    this.hideItemInUseDialog = this.hideItemInUseDialog.bind(this);
  }

  onCreateItem(item) {
    return this.props.mutator.owners.POST(item);
  }

  onDeleteItem() {
    const { selectedItem } = this.state;

    this.props.mutator.activeRecord.update({ id: selectedItem.id });

    return this.props.mutator.owners.DELETE({ id: selectedItem.id })
      .then(() => {
        this.showDeletionSuccessCallout(selectedItem);
        this.deleteItemResolve();
      })
      .catch(() => {
        this.setState({ showItemInUseDialog: true });
        this.deleteItemReject();
      })
      .finally(() => this.hideConfirmDialog());
  }

  onUpdateItem(item) {
    this.props.mutator.activeRecord.update({ id: item.id });
    return this.props.mutator.owners.PUT(item);
  }

  hideConfirmDialog() {
    this.setState({
      showConfirmDialog: false,
      selectedItem: {},
    });
  }

  hideItemInUseDialog() {
    this.setState({
      showItemInUseDialog: false,
      selectedItem: {},
    });
  }

  showConfirmDialog(itemId) {
    const selectedItem = this.props.resources.owners.records.find(t => t.id === itemId);

    this.setState({
      showConfirmDialog: true,
      selectedItem,
    });

    return new Promise((resolve, reject) => {
      this.deleteItemResolve = resolve;
      this.deleteItemReject = reject;
    });
  }

  showDeletionSuccessCallout(item) {
    const message = (
      <SafeHTMLMessage
        id="stripes-smart-components.cv.termDeleted"
        values={{
          type: this.props.stripes.intl.formatMessage({ id: 'ui-users.owners.singular' }),
          term: item[this.state.primaryField],
        }}
      />
    );

    this.callout.sendCallout({ message });
  }

  validate({ items }) {
    const { intl: { formatMessage } } = this.props;
    const { primaryField } = this.state;
    const servicePoints = _.get(this.props.resources, ['servicePoints', 'records', 0, 'servicepoints'], []);
    const none = servicePoints.find(s => s.name === 'None') || {};

    if (Array.isArray(items)) {
      const errors = [];

      items.forEach((item, index) => {
        // Start with getting a validation check from the parent component.
        const itemErrors = validate(item, index, items, 'owner', this.props.stripes.intl.formatMessage({ id: 'ui-users.owners.singular' })) || {};

        // Check if the primary field has had data entered into it.
        if (!item[primaryField]) {
          itemErrors[primaryField] =
            formatMessage({ id: 'stripes-core.label.missingRequiredField' });
        }

        const asp = item.servicePointOwner || [];
        asp.forEach(s => {
          if (s.value === none.id && asp.length > 1) {
            itemErrors.servicePointOwner = 'Error';
          }
        });


        // Add the errors if we found any for this record.
        if (itemErrors && Object.keys(itemErrors).length) {
          errors[index] = itemErrors;
        }
      });

      if (errors.length) {
        return { items: errors };
      }
    }

    return {};
  }

  render() {
    if (!this.props.resources.owners) return <div />;

    const { intl: { formatMessage } } = this.props;
    const rows = this.props.resources.owners.records || [];
    const type = this.props.stripes.intl.formatMessage({ id: 'ui-users.owners.singular' });
    const term = this.state.selectedItem[this.state.primaryField];
    const servicePoints = _.get(this.props.resources, ['servicePoints', 'records', 0, 'servicepoints'], []);
    const serviceOwners = [];
    rows.forEach(o => {
      const asp = o.servicePointOwner || [];
      asp.forEach(s => {
        if (!serviceOwners.includes(s.value)) {
          serviceOwners.push(s.value);
        }
      });
    });
    const options = [];
    servicePoints.forEach(s => {
      if (!serviceOwners.includes(s.id) || s.name === 'None') {
        options.push({ value: s.id, label: s.name});
      }
    });

    const fieldComponents = {
      'servicePointOwner': ({ fieldProps }) => (
        <Field
          {...fieldProps}
          component={MultiSelection}
          onChange={this.onChangeSelection}
          dataOptions={options}
        />
      )
    };

    const modalMessage = (
      <SafeHTMLMessage
        id="stripes-smart-components.cv.termWillBeDeleted"
        values={{ type, term }}
      />
    );

    const formatter = {
      'servicePointOwner': (value) => {
        const asp = value.servicePointOwner || [];
        const items = asp.map(a => <li>{a.label}</li>);
        return <ul>{items}</ul>;
      }
    }

    return (
      <Paneset>
        <Pane defaultWidth="fill" fluidContentWidth paneTitle={this.props.label}>
          <EditableList
            {...this.props}
            fieldComponents={fieldComponents}
            contentData={rows}
            createButtonLabel={formatMessage({ id: 'stripes-core.button.new' })}
            visibleFields={['owner', 'desc', 'servicePointOwner']}
            columnMapping={{
              owner: this.props.stripes.intl.formatMessage({ id: 'ui-users.owners.columns.owner' }),
              desc: this.props.stripes.intl.formatMessage({ id: 'ui-users.owners.columns.desc' }),
              'servicePointOwner': this.props.stripes.intl.formatMessage({ id: 'ui-users.owners.columns.asp' })
            }}
            formatter={formatter}
            onUpdate={this.onUpdateItem}
            onCreate={this.onCreateItem}
            onDelete={this.showConfirmDialog}
            isEmptyMessage={
              formatMessage({ id: 'stripes-smart-components.cv.noExistingTerms' },
                { terms: 'label' })
            }
            validate={this.validate}
          />
          <ConfirmationModal
            id={`delete${type.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}-confirmation`}
            open={this.state.showConfirmDialog}
            heading={formatMessage({ id: 'stripes-core.button.deleteEntry' }, { entry: type })}
            message={modalMessage}
            onConfirm={this.onDeleteItem}
            onCancel={this.hideConfirmDialog}
            confirmLabel={formatMessage({ id: 'stripes-core.button.delete' })}
          />
          <Callout ref={(ref) => { this.callout = ref; }} />
        </Pane>
      </Paneset>
    );
  }
}

export default injectIntl(OwnerSettings);
