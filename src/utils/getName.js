import getUrl from './getUrl';
import getHash from './getHash';

export default (entity, id, parentId, extra, ...args) => {
  const newExtra = { ...extra };

  if (newExtra.page) {
    delete newExtra.page;
  }

  const url = getUrl(entity, id, parentId, newExtra, ...args);

  if (id === false) {
    if (parentId === false) {
      return `${entity}-list-${getHash(url)}`;
    } else {
      return `${entity}-list-${parentId}-${getHash(url)}`;
    }
  }

  return `${entity}-${getHash(url)}`;
};
