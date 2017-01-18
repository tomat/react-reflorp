export default class EntityState {
  constructor({
    data,
    draft,
    dirty,
    entity,
    id,
    parentId,
    dispatch,
    onSave = () => {},
    onEdit = () => {},
    onDel = () => {},
  }) {
    /** @type PromiseState */
    this.data = data;

    /** @type PromiseState */
    this.draft = draft;

    /** @type string */
    this.entity = entity;

    /** @type string */
    this.id = id;

    /** @type string */
    this.parentId = parentId;

    /** @type bool */
    this.dirty = dirty;

    /** @type function */
    this.dispatch = dispatch;

    /** @type bool */
    this.pending = !!(this.data && this.data.pending);

    /** @type bool */
    this.refreshing = !!(this.data && this.data.refreshing);

    /** @type bool */
    this.loading = this.pending || this.refreshing;

    /** @type bool */
    this.fulfilled = !!(this.data && this.data.fulfilled);

    /** @type bool */
    this.settled = !!(this.data && this.data.settled);

    /** @type bool */
    this.rejected = !!(this.data && this.data.rejected);

    /** @type object|string */
    this.reason = this.data && this.data.reason;

    /** @type object */
    this.value = this.data && this.data.value;

    /** @type string|bool */
    this.error = (
      (this.data && this.data.rejected)
      ? (this.data.reason ? this.data.reason : 'Unknown error')
      : false
    );

    /** @type function */
    this.onSave = onSave;

    /** @type function */
    this.onEdit = onEdit;

    /** @type function */
    this.onDel = onDel;
  }

  save = (_then, _catch) => {
    const newData = this.draft.value;

    this.onSave(newData, _then, _catch);
  };

  edit = (draft) => {
    const newData = { ...this.draft.value, ...draft };

    this.onEdit(newData);
  };

  del = (_then, _catch) => {
    this.onDel(_then, _catch);
  };

  reset = () => {
    this.onEdit({ ...this.data.value });
  };

  handleChange = ({ target, property, value }) => {
    if (target) {
      property = target.name;

      if (target.type === 'checkbox') {
        value = !!target.checked;
      } else {
        value = target.value;
      }
    }

    if (property) {
      const newData = { ...this.draft.value };

      if (property.indexOf('.') !== -1) {
        const [ field, field2 ] = property.split('.');
        if (field2) {
          newData[field][field2] = value;
        } else {
          newData[field] = value;
        }
      } else {
        newData[property] = value;
      }

      this.edit(newData);
    }
  };
}
