import { remove, removeFromList, refreshing, unRefreshing, reject } from '../utils/reducer';
import EntityConfiguration from '../EntityConfiguration';
import buildRequest from 'react-refetch/lib/utils/buildRequest';

export default (/** @type EntityConfiguration */ entityConfiguration) => {
  if (!entityConfiguration instanceof EntityConfiguration) {
    throw `Expected EntityConfiguration, got ${typeof entityConfiguration}.`;
  }

  const dispatch = entityConfiguration.dispatch;

  return ({ id, parentId = false, onDel = () => {} }) => {
    const url = entityConfiguration.url({ id, parentId });
    const key = entityConfiguration.singleKey({ id, parentId });
    const draftKey = entityConfiguration.singleKey({ id, parentId });
    const listKey = entityConfiguration.listKey({ parentId });
    const delKey = entityConfiguration.refetchDelKey({ id, parentId });
    const delResponseKey = entityConfiguration.refetchDelResponseKey({ id, parentId });

    return {
      [delKey]: (data, callbacks) => ({
        [delResponseKey]: {
          url,
          comparison: url,
          method: 'DELETE',
          force: true,
          buildRequest: (mapping) => {
            dispatch(refreshing(key));
            dispatch(refreshing(draftKey));

            return buildRequest(mapping);
          },
          then: (value) => {
            dispatch(removeFromList(listKey, id));

            dispatch(remove(key));
            dispatch(remove(draftKey));

            return {
              value,
              comparison: url,
              force: true,
              andThen: () => {
                const newData = { id, parentId };

                if (entityConfiguration.onDel) {
                  entityConfiguration.onDel(newData);
                }

                if (onDel) {
                  onDel(newData);
                }

                if (callbacks.then) {
                  callbacks.then(newData);
                }

                return {};
              },
            };
          },
          catch: (exception, meta) => {
            const errorMessage = (exception && exception.message) || meta.response.statusText;

            dispatch(unRefreshing(key));
            dispatch(reject(draftKey, errorMessage, meta));

            if (callbacks.catch) {
              callbacks.catch(errorMessage);
            }

            return undefined;
          },
        },
      }),
    };
  };
};
