import { PromiseState } from 'react-refetch';
import extend from 'extend';

const reducer = (state = {}, action) => {
  switch (action.type) {
    case 'UPDATE':
      const newState = extend(true, {}, state);
      newState[action.name] = action.data;

      return newState;
    case 'UPDATE_DRAFT':
      {
        const newState = extend(true, {}, state);
        newState[action.name + 'Draft'] = action.data;

        return newState;
      }
    case 'UPDATE_LIST':
      if (state[action.listName] && state[action.listName].value) {
        const newState = extend(true, {}, state);
        const newValue = newState[action.listName].value.map((item) => {
          if (item.id === action.id) {
            return action.data;
          }

          return item;
        }).filter((item) => item !== false);

        newState[action.listName] = PromiseState.resolve(newValue);

        return newState;
      }

      return state;
    case 'APPEND':
      if (state[action.name] && state[action.name].value) {
        const newState = extend(true, {}, state);
        const done = [];
        const newValue = newState[action.name].value.concat(action.data).filter((note) => {
          if (done.indexOf(note.id) === -1) {
            done.push(note.id);

            return true;
          }

          return false;
        });

        newState[action.name] = PromiseState.resolve(newValue, newState[action.name].meta);

        return newState;
      }

      return state;
    case 'REFRESHING':
      if (state[action.name] && state[action.name].value) {
        const newState = extend(true, {}, state);
        newState[action.name] = PromiseState.refresh(newState[action.name]);

        return newState;
      }

      return state;
    case 'INCREASE_COUNT':
      if (state[action.name] && state[action.name].value && state[action.name].value[action.key]) {
        const newState = extend(true, {}, state);
        newState[action.name].value[action.key]++;

        return newState;
      }

      return state;
    case 'DECREASE_COUNT':
      if (state[action.name] && state[action.name].value && state[action.name].value[action.key]) {
        const newState = extend(true, {}, state);
        newState[action.name].value[action.key]--;

        return newState;
      }

      return state;
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

export const updateDraft = (name, data) => ({
  type: 'UPDATE_DRAFT',
  name,
  data,
});

export const updateList = (id, listName, data) => ({
  type: 'UPDATE_LIST',
  id,
  listName,
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

export const decreaseCount = (name, key) => ({
  type: 'DECREASE_COUNT',
  name,
  key,
});
