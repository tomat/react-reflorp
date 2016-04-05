import { PromiseState } from 'react-refetch';
import extend from 'extend';

const reducer = (state = {}, action) => {
  const data = extend(true, {}, state);
  switch (action.type) {
    case 'UPDATE':
      data[action.name] = action.data;

      return data;
    case 'APPEND':
      if (data[action.name] && data[action.name].value) {
        const done = [];
        const newValue = data[action.name].value.concat(action.data).filter((note) => {
          if (done.indexOf(note.id) === -1) {
            done.push(note.id);

            return true;
          }

          return false;
        });

        data[action.name] = PromiseState.resolve(newValue, data[action.name].meta);
      }

      return data;
    case 'REFRESHING':
      if (data[action.name] && data[action.name].value) {
        data[action.name] = PromiseState.refresh(data[action.name]);
      }

      return data;
    case 'INCREASE_COUNT':
      if (data[action.name] && data[action.name].value && data[action.name].value[action.key]) {
        data[action.name].value[action.key]++;
      }

      return data;
    default:
      return state;
  }
};

export default reducer;

export const update = (name, data) => ({
  type: 'UPDATE',
  name,
  data,
});

export const append = (name, data) => ({
  type: 'APPEND',
  name,
  data,
});

export const refreshing = (name) => ({
  type: 'REFRESHING',
  name,
});

export const increaseCount = (name, key) => ({
  type: 'INCREASE_COUNT',
  name,
  key,
});
