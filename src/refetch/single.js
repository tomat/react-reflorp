import { PromiseState } from 'react-refetch';
import { update, create, reject } from '../utils/reducer';
import EntityConfiguration from '../EntityConfiguration';
import buildRequest from 'react-refetch/lib/utils/buildRequest';

export default (/** @type EntityConfiguration */ entityConfiguration) => {
  if (!entityConfiguration instanceof EntityConfiguration) {
    throw `Expected EntityConfiguration, got ${typeof entityConfiguration}.`;
  }

  const dispatch = entityConfiguration.dispatch;

  return ({ id, parentId = false }) => {
    const url = entityConfiguration.url({ id, parentId });
    const key = entityConfiguration.singleKey({ id, parentId });
    const draftKey = entityConfiguration.draftKey({ id, parentId });
    const responseKey = entityConfiguration.refetchSingleResponseKey({ id, parentId });

    return {
      [responseKey]: {
        comparison: url,
        url: url,
        method: 'GET',
        buildRequest: (mapping) => {
          dispatch(create(key, PromiseState.create()));
          dispatch(create(draftKey, PromiseState.create()));

          return buildRequest(mapping);
        },
        then: (value) => {
          dispatch(update(key, PromiseState.resolve(value)));
          dispatch(update(draftKey, PromiseState.resolve(value)));

          return {
            value,
            comparison: url,
            force: true,
          };
        },
        catch: (exception, meta) => {
          const errorMessage = (exception && exception.message) || meta.response.statusText;

          dispatch(reject(key, errorMessage, meta));

          return undefined;
        },
      },
    };
  };
};
