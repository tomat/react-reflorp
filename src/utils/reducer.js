import { PromiseState } from 'react-refetch';
import extend from 'extend';

const prefix = 'reflorp/';

const reducer = (state = {}, action) => {
  switch (action.type) {
    case prefix + 'UPDATE':
      if (typeof action.data !== 'undefined') {
        const newState = extend(false, {}, state);
        newState[action.name] = action.data;

        return newState;
      }

      return state;
    case prefix + 'CREATE':
      if (typeof action.data !== 'undefined') {
        if (typeof state[action.name] === 'undefined') {
          const newState = extend(false, {}, state);
          newState[action.name] = action.data;

          return newState;
        } else {
          const newState = extend(true, {}, state);
          newState[action.name] = PromiseState.refresh(newState[action.name]);

          return newState;
        }
      }

      return state;
    case prefix + 'UPDATE_MULTI':
      if (typeof action.data !== 'undefined') {
        const newState = extend(false, {}, state);
        Object.keys(action.data).forEach((hash) => {
          newState[hash] = action.data[hash];
        });

        return newState;
      }

      return state;
    case prefix + 'UPDATE_LIST':
      if (state[action.listName] && state[action.listName].value) {
        const newState = extend(false, {}, state);
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
    case prefix + 'APPEND':
      if (state[action.name] && state[action.name].value) {
        const newState = extend(true, {}, state);
        const done = [];
        const newValue = newState[action.name].value.concat(action.data).filter((item) => {
          if (done.indexOf(item.id) === -1) {
            done.push(item.id);

            return true;
          }

          return false;
        });

        newState[action.name] = PromiseState.resolve(newValue, newState[action.name].meta);

        return newState;
      }

      return state;
    case prefix + 'REFRESHING':
      if (state[action.name] && state[action.name].value) {
        const newState = extend(true, {}, state);
        newState[action.name] = PromiseState.refresh(newState[action.name]);

        return newState;
      }

      return state;
    case prefix + 'INCREASE_COUNT':
      if (state[action.name] && state[action.name].value && state[action.name].value[action.key]) {
        const newState = extend(true, {}, state);
        newState[action.name].value[action.key]++;

        return newState;
      }

      return state;
    case prefix + 'DECREASE_COUNT':
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

export const create = (name, data) => ({
  type: prefix + 'CREATE',
  name,
  data,
});

export const update = (name, data) => ({
  type: prefix + 'UPDATE',
  name,
  data,
});

export const updateList = (id, listName, data) => ({
  type: prefix + 'UPDATE_LIST',
  id,
  listName,
  data,
});

export const updateMulti = (data) => ({
  type: prefix + 'UPDATE_MULTI',
  data,
});

export const append = (name, data) => ({
  type: prefix + 'APPEND',
  name,
  data,
});

export const refreshing = (name) => ({
  type: prefix + 'REFRESHING',
  name,
});

export const increaseCount = (name, key) => ({
  type: prefix + 'INCREASE_COUNT',
  name,
  key,
});

export const decreaseCount = (name, key) => ({
  type: prefix + 'DECREASE_COUNT',
  name,
  key,
});
