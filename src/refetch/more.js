import { PromiseState } from 'react-refetch';
import { update, updateMulti, refreshing, appendList, reject } from '../utils/reducer';
import EntityConfiguration from '../EntityConfiguration';
import buildRequest from 'react-refetch/lib/utils/buildRequest';

export default (/** @type EntityConfiguration */ entityConfiguration) => {
  if (!entityConfiguration instanceof EntityConfiguration) {
    throw `Expected EntityConfiguration, got ${typeof entityConfiguration}.`;
  }

  const dispatch = entityConfiguration.dispatch;

  return ({ parentId = false, query = {} }) => {
    const key = entityConfiguration.listKey({ parentId, query, flags: [ 'list' ] });
    const pageKey = entityConfiguration.listPageKey({ parentId, query });
    const hasMoreKey = entityConfiguration.listHasMoreKey({ parentId, query });
    const moreKey = entityConfiguration.refetchListMoreKey({ parentId, query });
    const moreResponseKey = entityConfiguration.refetchListMoreResponseKey({ parentId, query });

    return {
      [moreKey]: (page) => {
        const url = entityConfiguration.url({ parentId, query: { ...query, page } });

        return {
          [moreResponseKey]: {
            comparison: url,
            url: url,
            method: 'GET',
            buildRequest: (mapping) => {
              dispatch(refreshing(key));
              dispatch(update(pageKey, page));

              return buildRequest(mapping);
            },
            then: (value) => {
              const updates = {};

              if (value.length === 0) {
                dispatch(update(hasMoreKey, false));
              }

              value.forEach((item) => {
                const itemKey = entityConfiguration.singleKey({ id: item.id, parentId: parentId || false });
                const itemDraftKey = entityConfiguration.draftKey({ id: item.id, parentId: parentId || false });
                updates[itemKey] = PromiseState.resolve(item);
                updates[itemDraftKey] = PromiseState.resolve(item);
              });

              dispatch(updateMulti(updates));

              dispatch(appendList(key, value));

              return {
                value,
                force: true,
                comparison: url,
              };
            },
            catch: (exception, meta) => {
              const errorMessage = (exception && exception.message) || meta.response.statusText;

              dispatch(reject(key, errorMessage, meta));

              return undefined;
            },
          },
        };
      },
    };
  };
};
