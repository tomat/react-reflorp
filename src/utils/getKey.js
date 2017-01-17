const getKey = ({ entityConfiguration, id = false, parentId = false, extra = {}, flags = [] }) => {
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

  if (Object.keys(extra).length > 0) {
    key += '?';
    Object.keys(extra).forEach((k) => {
      key += `${k}=${extra[k]}&`;
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
