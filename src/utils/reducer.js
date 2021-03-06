import { PromiseState } from 'react-refetch';
import extend from 'extend';

const prefix = 'reflorp/';

const reducer = (state = {}, action) => {
  switch (action.type) {
    case prefix + 'RESET':
      return {};
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
    case prefix + 'REMOVE':
      if (typeof state[action.name] !== 'undefined') {
        const newState = extend(false, {}, state);
        delete newState[action.name];

        return newState;
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
    case prefix + 'UPDATE_BATCH':
      if (typeof action.data !== 'undefined') {
        let newState = extend(false, {}, state);
        Object.keys(action.data).forEach((hash) => {
          newState = reducer(newState, action.data[hash]);
        });

        return newState;
      }

      return state;
    case prefix + 'APPEND_LIST':
      if (typeof action.data !== 'undefined') {
        const newState = extend(false, {}, state);
        const { name, data } = action;

        if (typeof newState[name] !== 'undefined' && newState[name].value && newState[name].value.map) {
          const newValue = newState[name].value.concat(data);

          newState[name] = PromiseState.resolve(newValue, newState[name].meta);

          return newState;
        }
      }

      return state;
    case prefix + 'UPDATE_LIST':
      if (typeof action.data !== 'undefined') {
        const newState = extend(false, {}, state);
        const { name, data } = action;

        if (typeof newState[name] !== 'undefined' && newState[name].value && newState[name].value.map) {
          const newValue = newState[name].value.map((k) => {
            if (k.id === data.id) {
              return data;
            }

            return k;
          });

          newState[name] = PromiseState.resolve(newValue, newState[name].meta);

          return newState;
        }
      }

      return state;
    case prefix + 'REMOVE_FROM_LIST':
      if (typeof action.id !== 'undefined') {
        const newState = extend(false, {}, state);
        const { name, id } = action;

        if (typeof newState[name] !== 'undefined' && newState[name].value && newState[name].value.map) {
          const newValue = newState[name].value.filter((k) => (k.id !== id));

          newState[name] = PromiseState.resolve(newValue, newState[name].meta);

          return newState;
        }
      }

      return state;
    case prefix + 'REFRESHING':
      if (state[action.name] && state[action.name].value) {
        const newState = extend(true, {}, state);
        newState[action.name] = PromiseState.refresh(newState[action.name]);

        return newState;
      }

      return state;
    case prefix + 'UNREFRESHING':
      if (state[action.name] && state[action.name].value) {
        const newState = extend(true, {}, state);
        newState[action.name] = PromiseState.resolve(newState[action.name].value);

        return newState;
      }

      return state;
    case prefix + 'REJECT':
      if (typeof action.data !== 'undefined') {
        const newState = extend(true, {}, state);

        const errorMessage = (action.data !== '[object Object]' && action.data) || 'Unknown error';
        if (state[action.name] && state[action.name].value) {
          newState[action.name] = PromiseState.resolve(newState[action.name].value, action.meta);
          newState[action.name].rejected = true;
          newState[action.name].reason = errorMessage;
        } else {
          newState[action.name] = PromiseState.reject(errorMessage, action.meta);
        }

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

export const remove = (name) => ({
  type: prefix + 'REMOVE',
  name,
});

export const update = (name, data) => ({
  type: prefix + 'UPDATE',
  name,
  data,
});

export const updateMulti = (data) => ({
  type: prefix + 'UPDATE_MULTI',
  data,
});

export const updateBatch = (data) => ({
  type: prefix + 'UPDATE_BATCH',
  data,
});

export const appendList = (name, data) => ({
  type: prefix + 'APPEND_LIST',
  name,
  data,
});

export const updateList = (name, data) => ({
  type: prefix + 'UPDATE_LIST',
  name,
  data,
});

export const removeFromList = (name, id) => ({
  type: prefix + 'REMOVE_FROM_LIST',
  name,
  id,
});

export const refreshing = (name) => ({
  type: prefix + 'REFRESHING',
  name,
});

export const unRefreshing = (name) => ({
  type: prefix + 'UNREFRESHING',
  name,
});

export const reject = (name, data, meta) => ({
  type: prefix + 'REJECT',
  name,
  data,
  meta,
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

export const reset = () => ({
  type: prefix + 'RESET',
});
