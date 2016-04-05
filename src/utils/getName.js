import getUrl from './getUrl';
import getHash from './getHash';

export default (entity, ...args) => {
  const url = getUrl(entity, ...args);

  return `${entity}-${getHash(url)}`;
};
