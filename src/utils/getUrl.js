const getUrl = ({ entityConfiguration, id = false, parentId = false, query = {} }) => {
  const entity = entityConfiguration.entity;

  let url = '';

  // Has parent, so add the parent URL first
  if (entityConfiguration.parentEntity && parentId !== false) {
    url += getUrl({
      entityConfiguration: entityConfiguration.parentConfiguration,
      entity: entityConfiguration.parentEntity,
      id: parentId,
      parentId: false,
      query: {},
    });
  }

  url += '/';

  if (entityConfiguration.plural) {
    url += entityConfiguration.plural;
  } else {
    url += `${entity}s`;
  }

  if (id) {
    url += `/${id}`;
  }

  if (Object.keys(query).length > 0) {
    url += '?';
    Object.keys(query).forEach((k) => {
      url += `${k}=${query[k]}&`;
    });
  }

  return url;
};

export default getUrl;
