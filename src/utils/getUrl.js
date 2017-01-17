const getUrl = ({ entityConfiguration, id = false, parentId = false, extra = {} }) => {
  const entity = entityConfiguration.entity;

  let url = '';

  // Has parent, so add the parent URL first
  if (entityConfiguration.parentEntity && parentId !== false) {
    url += getUrl({
      entityConfiguration: entityConfiguration.parentConfiguration,
      entity: entityConfiguration.parentEntity,
      id: parentId,
      parentId: false,
      extra: {},
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

  if (Object.keys(extra).length > 0) {
    url += '?';
    Object.keys(extra).forEach((k) => {
      url += `${k}=${extra[k]}&`;
    });
  }

  return url;
};

export default getUrl;
