import { PropTypes, Component } from 'react';
import refetch, { getStore, getEntities } from './reflorpRefetch';
import { updateMulti } from '../utils/reducer';

@refetch(() => {
  const create = {};
  const edit = {};
  const editDraft = {};
  const myDelete = {};
  const loadMore = {};
  Object.keys(getEntities()).forEach((entity) => {
    create[`${entity}Create`] = true;
    edit[`${entity}Edit`] = true;
    editDraft[`${entity}EditDraft`] = true;
    myDelete[`${entity}Delete`] = true;
    loadMore[`${entity}LoadMore`] = true;
  });

  return {
    ...create,
    ...edit,
    ...editDraft,
    ...myDelete,
    ...loadMore,
  };
})
export default class ReflorpWrapper extends Component {
  static propTypes = {
    children: PropTypes.node,
  };

  componentWillMount() {
    this.refresh(this.props);
  }

  refresh(props) {
    const store = getStore();

    const updates = {};

    Object.keys(getEntities()).forEach((entity) => {
      updates[`${entity}Create`] = props[`${entity}Create`];
      updates[`${entity}Edit`] = props[`${entity}Edit`];
      updates[`${entity}EditDraft`] = props[`${entity}EditDraft`];
      updates[`${entity}Delete`] = props[`${entity}Delete`];
      updates[`${entity}LoadMore`] = props[`${entity}LoadMore`];
    });

    store.dispatch(updateMulti(updates));
  }

  render() {
    return this.props.children ? this.props.children : null;
  }
}
