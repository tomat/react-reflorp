import { PromiseState } from 'react-refetch';
import extend from 'extend';

const reducer = (state = {}, action) => {
  switch (action.type) {
    case 'UPDATE':
      state[action.name] = action.data;

      return state;
    case 'UPDATE_DRAFT':
      state[action.name + 'Draft'] = action.data;

      return state;
    case 'UPDATE_LIST':
      if (state[action.listName] && state[action.listName].value) {
        const newValue = state[action.listName].value.map((item) => {
          if (item.id === action.id) {
            return action.data;
          }

          return item;
        }).filter((item) => item !== false);

        state[action.listName] = PromiseState.resolve(newValue);
      }

      return state;
    case 'APPEND':
      if (state[action.name] && state[action.name].value) {
        const done = [];
        const newValue = state[action.name].value.concat(action.data).filter((note) => {
          if (done.indexOf(note.id) === -1) {
            done.push(note.id);

            return true;
          }

          return false;
        });

        state[action.name] = PromiseState.resolve(newValue, state[action.name].meta);
      }

      return state;
    case 'REFRESHING':
      if (state[action.name] && state[action.name].value) {
        state[action.name] = PromiseState.refresh(state[action.name]);
      }

      return state;
    case 'INCREASE_COUNT':
      if (state[action.name] && state[action.name].value && state[action.name].value[action.key]) {
        const newState = extend(true, {}, state[action.name]);
        newState[action.key].value++;

        state[action.name] = newState;
      }

      return state;
    case 'DECREASE_COUNT':
      if (state[action.name] && state[action.name].value && state[action.name].value[action.key]) {
        const newState = extend(true, {}, state[action.name]);
        newState[action.key].value--;

        state[action.name] = newState;
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
