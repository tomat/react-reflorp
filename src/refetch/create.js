import { PromiseState } from 'react-refetch';
import { update, appendList, updateBatch, refreshing, reject } from '../utils/reducer';
import EntityConfiguration from '../EntityConfiguration';
import buildRequest from 'react-refetch/lib/utils/buildRequest';

export default (/** @type EntityConfiguration */ entityConfiguration) => {
  if (!entityConfiguration instanceof EntityConfiguration) {
    throw `Expected EntityConfiguration, got ${typeof entityConfiguration}.`;
  }

  const dispatch = entityConfiguration.dispatch;

  return ({ parentId = false, onCreate = () => {} }) => {
    const url = entityConfiguration.url({ parentId });
    const newDraftKey = entityConfiguration.newDraftKey({ parentId });
    const createKey = entityConfiguration.refetchCreateKey({ parentId });
    const createResponseKey = entityConfiguration.refetchCreateResponseKey({ parentId });

    return {
      [createKey]: (data) => ({
        [createResponseKey]: {
          comparison: url,
          url: url,
          method: 'POST',
          force: true,
          body: JSON.stringify(data),
          buildRequest: (mapping) => {
            dispatch(refreshing(newDraftKey));

            return buildRequest(mapping);
          },
          then: (value) => {
            const multi = [];

            multi.push(update(newDraftKey, PromiseState.resolve(value)));

            const key = entityConfiguration.singleKey({ id: value.id, parentId });
            const draftKey = entityConfiguration.draftKey({ id: value.id, parentId });
            const listKey = entityConfiguration.listKey({ parentId });

            multi.push(update(key, PromiseState.resolve(value)));
            multi.push(update(draftKey, PromiseState.resolve(value)));
            multi.push(appendList(listKey, [ value ]));

            dispatch(updateBatch(multi));

            return {
              value,
              comparison: url,
              force: true,
              andThen: (value) => {
                if (entityConfiguration.onCreate) {
                  entityConfiguration.onCreate(PromiseState.resolve(value));
                }

                if (onCreate) {
                  onCreate(PromiseState.resolve(value));
                }

                return {};
              },
            };
          },
          catch: (exception, meta) => {
            const errorMessage = (exception && exception.message) || meta.response.statusText;

            dispatch(reject(newDraftKey, errorMessage, meta));

            return undefined;
          },
        },
      }),
    };
  };
};
