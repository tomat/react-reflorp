const getKey = ({ entityConfiguration, id = false, parentId = false, query = {}, flags = [] }) => {
  const entity = entityConfiguration.entity;

  let key = '';

  // Has parent, so add the parent URL first
  if (entityConfiguration.parentEntity && parentId !== false) {
    key += getKey({
      entityConfiguration: entityConfiguration.parentConfiguration,
      entity: entityConfiguration.parentEntity,
      id: parentId,
      parentId: false,
    });
  }

  key += '/';

  if (entityConfiguration.plural) {
    key += entityConfiguration.plural;
  } else {
    key += `${entity}s`;
  }

  if (id) {
    key += `/${id}`;
  }

  if (Object.keys(query).length > 0) {
    key += '?';
    Object.keys(query).forEach((k) => {
      key += `${k}=${query[k]}&`;
    });
  }

  flags.forEach((f, i) => {
    if (i === 0) {
      key += '#';
    } else {
      key += '-';
    }
    key += f;
  });

  return key;
};

export default getKey;
