import { getEntities, getBaseUrl } from '../components/reflorpRefetch';

const getUrl = (entity, id = false, parentId = false, extra = {}, first = true) => {
  const entities = getEntities();

  if (!entities[entity]) {
    return false;
  }

  const entityConfiguration = entities[entity];
  let url = '';

  if (entityConfiguration.parent && parentId) {
    url += `${getUrl(entityConfiguration.parent, parentId, false, {}, false)}/`;
  } else {
    url += '/';
  }

  if (entityConfiguration.plural) {
    url += entityConfiguration.plural;
  } else {
    url += `${entity}s`;
  }

  if (id) {
    url += `/${id}`;
  }

  if (Object.keys(extra).length > 0) {
    url += '?';
    Object.keys(extra).forEach((k) => {
      url += `${k}=${extra[k]}&`;
    });
  }

  if (first) {
    url = getBaseUrl() + url;
  }

  return url;
}

export default getUrl;
