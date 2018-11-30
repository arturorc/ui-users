import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

import {
  Accordion, ExpandAllButton, Pane, Row, Col, PaneMenu, Button, IconButton, TextArea, Checkbox, Datepicker, AppIcon
} from '@folio/stripes/components';
import { TitleManager } from '@folio/stripes/core';
import { Field } from 'redux-form';
import stripesForm from '@folio/stripes/form';
import { ViewMetaData } from '@folio/stripes/smart-components';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import { getFullName } from '../../util';
import UserDetails from '../Accounts/ChargeFeeFine/UserDetails';

const validate = (item, props) => {
  const errors = {};
  if (!item.desc) {
    errors.desc = props.stripes.intl.formatMessage({ id: 'ui-users.blocks.form.validate.desc' });
  }
  if (!item.borrowing && !item.renewals && !item.requests) {
    errors.borrowing = props.stripes.intl.formatMessage({ id: 'ui-users.blocks.form.validate.any' });
    errors.renewals = props.stripes.intl.formatMessage({ id: 'ui-users.blocks.form.validate.any' });
    errors.requests = props.stripes.intl.formatMessage({ id: 'ui-users.blocks.form.validate.any' });
  }
  if (!item.expirationDate) {
    errors.expirationDate = props.stripes.intl.formatMessage({ id: 'ui-users.blocks.form.validate.date' });
  }
  if (moment(moment(item.expirationDate).format()).isBefore(moment().format())) {
    errors.expirationDate = props.stripes.intl.formatMessage({ id: 'ui-users.blocks.form.validate.future' });
  }
  return errors;
};

class PatronBlockForm extends React.Component {
  static propTypes = {
    user: PropTypes.object,
    pristine: PropTypes.bool,
    submitting: PropTypes.bool,
    invalid: PropTypes.bool,
    selectedItem: PropTypes.object,
    query: PropTypes.object,
    onDeleteItem: PropTypes.func,
    onClose: PropTypes.func,
    initialize: PropTypes.func,
    handleSubmit: PropTypes.func.isRequired,
    stripes: PropTypes.shape({
      intl: PropTypes.object,
      connect: PropTypes.func,
    }),
  };

  constructor(props) {
    super(props);

    this.handleExpandAll = this.handleExpandAll.bind(this);
    this.handleSectionToggle = this.handleSectionToggle.bind(this);

    this.connectedViewMetaData = props.stripes.connect(ViewMetaData);

    this.state = {
      sections: {
        blockInformationSection: true,
        blockActionsSection: true,
      },
    };
  }

  componentDidMount() {
    this.props.initialize({
      borrowing: true,
      renewals: true,
      requests: true
    });

    if (this.props.selectedItem.id) {
      this.props.initialize(this.props.selectedItem);
    }
  }

  componentDidUpdate(prevProps) {
    if (JSON.stringify(prevProps.selectedItem) !== JSON.stringify(this.props.selectedItem)) {
      this.props.initialize(this.props.selectedItem);
    }
  }

  handleSectionToggle({ id }) {
    this.setState((curState) => {
      const newState = _.cloneDeep(curState);
      newState.sections[id] = !newState.sections[id];
      return newState;
    });
  }

  handleExpandAll(obj) {
    this.setState((curState) => {
      const newState = _.cloneDeep(curState);
      newState.sections = obj;
      return newState;
    });
  }

  renderFirstMenu = () => (
    <PaneMenu>
      <IconButton
        id="close-patron-block"
        onClick={this.props.onClose}
        title="Close"
        icon="closeX"
      />
    </PaneMenu>
  );

  renderLastMenu = () => {
    const { pristine, submitting, invalid, query } = this.props;

    const submit =
      <Button buttonStyle="primary" onClick={this.props.handleSubmit} disabled={pristine || submitting || invalid}>
        {(query.layer === 'edit-block') ? this.props.stripes.intl.formatMessage({ id: 'ui-users.blocks.form.button.save' }) : this.props.stripes.intl.formatMessage({ id: 'ui-users.blocks.form.button.create' })}
      </Button>;
    const del = (query.layer === 'edit-block') ? <Button buttonStyle="danger" onClick={this.props.onDeleteItem}><FormattedMessage id="ui-users.blocks.form.button.delete" /></Button> : '';

    return (
      <PaneMenu>
        {del}
        {submit}
      </PaneMenu>
    );
  }

  render() {
    const user = this.props.user || {};
    const title = this.props.query.layer === 'edit-block' ?
      <div>
        {' '}
        <AppIcon app="users" size="small" />
        {getFullName(user)}
        {' '}
      </div> : 'New Block';
    const userD = this.props.query.layer !== 'edit-block' ? <UserDetails user={user} /> : '';

    return (
      <Pane defaultWidth="20%" firstMenu={this.renderFirstMenu()} paneTitle={title} lastMenu={this.renderLastMenu()}>
        <TitleManager />
        {userD}
        <Row end="xs">
          <Col xs>
            <ExpandAllButton accordionStatus={this.state.sections} onToggle={this.handleExpandAll} />
          </Col>
        </Row>
        <Row>
          <Col xs>
            <Accordion
              label={this.props.stripes.intl.formatMessage({ id: 'ui-users.blocks.form.label.information' })}
              id="blockInformationSection"
              onToggle={this.handleSectionToggle}
              open={this.state.sections.blockInformationSection}
            >
              {(this.props.selectedItem.metadata) ?
                <Row>
                  <Col xs={12} sm={10} md={7} lg={5}>
                    <this.connectedViewMetaData metadata={this.props.selectedItem.metadata} />
                  </Col>
                </Row> : ''
              }
              <form>
                <Row>
                  <Col xs={12} sm={10} md={7} lg={5}>
                    <Field
                      name="desc"
                      label={this.props.stripes.intl.formatMessage({ id: 'ui-users.blocks.form.label.display' })}
                      component={TextArea}
                      placeholder={this.props.stripes.intl.formatMessage({ id: 'ui-users.blocks.form.placeholder.desc' })}
                      fullWidth
                    />
                  </Col>
                </Row>
                <Row>
                  <Col xs={12} sm={10} md={7} lg={5}>
                    <Field
                      name="staffInformation"
                      label={this.props.stripes.intl.formatMessage({ id: 'ui-users.blocks.form.label.staff' })}
                      component={TextArea}
                      placeholder={this.props.stripes.intl.formatMessage({ id: 'ui-users.blocks.form.placeholder.information' })}
                      fullWidth
                    />
                  </Col>
                </Row>
                <Row>
                  <Col xs={12} sm={10} md={7} lg={5}>
                    <Field
                      label={this.props.stripes.intl.formatMessage({ id: 'ui-users.blocks.form.label.message' })}
                      name="patronMessage"
                      component={TextArea}
                      placeholder={this.props.stripes.intl.formatMessage({ id: 'ui-users.blocks.form.placeholder.message' })}
                      fullWidth
                    />
                  </Col>
                </Row>
                <Row>
                  <Col xs={12} sm={10} md={7} lg={5}>
                    <Field
                      component={Datepicker}
                      dateFormat="YYYY/MM/DD"
                      name="expirationDate"
                      label={this.props.stripes.intl.formatMessage({ id: 'ui-users.blocks.form.label.date' })}
                      backendDateStandard="YYYY/MM/DD"
                      useFocus
                    />
                  </Col>
                </Row>
                <Row>
                  <Col><FormattedMessage id="ui-users.blocks.form.label.block" /></Col>
                </Row>
                <Row>
                  <Col xs={12} sm={10} md={7} lg={5}>
                    <Field
                      name="borrowing"
                      id="borrowing"
                      label={this.props.stripes.intl.formatMessage({ id: 'ui-users.blocks.form.label.borrowing' })}
                      component={Checkbox}
                    />
                  </Col>
                </Row>
                <Row>
                  <Col xs={12} sm={10} md={7} lg={5}>
                    <Field
                      name="renewals"
                      id="renewals"
                      label={this.props.stripes.intl.formatMessage({ id: 'ui-users.blocks.form.label.renewals' })}
                      component={Checkbox}
                    />
                  </Col>
                </Row>
                <Row>
                  <Col xs={12} sm={10} md={7} lg={5}>
                    <Field
                      name="requests"
                      id="requests"
                      label={this.props.stripes.intl.formatMessage({ id: 'ui-users.blocks.form.label.request' })}
                      component={Checkbox}
                    />
                  </Col>
                </Row>
              </form>
            </Accordion>
          </Col>
        </Row>
      </Pane>
    );
  }
}

export default stripesForm({
  form: 'patron-block-form',
  validate,
  fields: [],
})(PatronBlockForm);
