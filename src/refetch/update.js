import { PromiseState } from 'react-refetch';
import { update, updateList, refreshing, unRefreshing, reject } from '../utils/reducer';
import EntityConfiguration from '../EntityConfiguration';
import buildRequest from 'react-refetch/lib/utils/buildRequest';

export default (/** @type EntityConfiguration */ entityConfiguration) => {
  if (!entityConfiguration instanceof EntityConfiguration) {
    throw `Expected EntityConfiguration, got ${typeof entityConfiguration}.`;
  }

  const dispatch = entityConfiguration.dispatch;

  return ({ id, parentId = false, onUpdate = () => {} }) => {
    const url = entityConfiguration.url({ id, parentId });
    const key = entityConfiguration.singleKey({ id, parentId });
    const draftKey = entityConfiguration.draftKey({ id, parentId });
    const listKey = entityConfiguration.listKey({ parentId });
    const updateKey = entityConfiguration.refetchUpdateKey({ id, parentId });
    const updateResponseKey = entityConfiguration.refetchUpdateResponseKey({ id, parentId });

    return {
      [updateKey]: (data, callbacks) => ({
        [updateResponseKey]: {
          url,
          comparison: url,
          method: 'PATCH',
          body: JSON.stringify(data),
          force: true,
          buildRequest: (mapping) => {
            dispatch(refreshing(key));
            dispatch(refreshing(draftKey));

            return buildRequest(mapping);
          },
          then: (value) => {
            dispatch(update(key, PromiseState.resolve(value)));
            dispatch(update(draftKey, PromiseState.resolve(value)));

            dispatch(updateList(listKey, value));

            return {
              value,
              comparison: url,
              force: true,
              andThen: (newData) => {
                if (entityConfiguration.onUpdate) {
                  entityConfiguration.onUpdate(newData);
                }

                if (onUpdate) {
                  onUpdate(newData);
                }

                if (callbacks.then) {
                  callbacks.then(newData);
                }

                return {};
              },
            };
          },
          catch: (exception, meta) => {
            dispatch(unRefreshing(key));
            dispatch(reject(draftKey, meta.response.statusText));

            if (callbacks.catch) {
              callbacks.catch(meta.response.statusText);
            }

            return undefined;
          },
        },
      }),
    };
  };
};
