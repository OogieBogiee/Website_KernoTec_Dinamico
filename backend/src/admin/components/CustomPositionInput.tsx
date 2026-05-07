import React, { useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useFetchClient } from '@strapi/admin/strapi-admin';
import { Field, TextInput } from '@strapi/design-system';

const CustomPositionInput = ({
  attribute,
  description,
  disabled,
  error,
  intlLabel,
  name,
  onChange,
  required,
  value,
  type,
}) => {
  const { formatMessage } = useIntl();
  const { get } = useFetchClient();
  const [internalError, setInternalError] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [currentType, setCurrentType] = useState(null);

  // Intentamos capturar el ID del objeto actual desde la URL y el tipo de la página (buscando en los datos del formulario)
  useEffect(() => {
    try {
      const match = window.location.pathname.match(/\/content-manager\/collection-types\/api::item\.item\/(\d+)/);
      if (match && match[1]) {
        setCurrentId(match[1]);
      }
    } catch (e) {}
  }, []);

  const handleBlur = async () => {
    if (!value) {
      setInternalError(null);
      return;
    }

    setIsChecking(true);
    try {
      // Como no tenemos acceso directo y reactivo al campo 'type' (Área/Servicio) del formulario 
      // a menos de interceptarlo, asumiremos el tipo por el propio campo que se evalúa:
      const checkType = name === 'position_area' ? 'Área' : 'Servicio';
      
      const res = await get(`/api/items/check-position?type=${checkType}&position=${value}&excludeId=${currentId || ''}`);
      
      if (res.data?.isOccupied) {
        setInternalError(`Esta posición ya la tiene el artículo "${res.data.occupiedBy}". Elige otra.`);
      } else {
        setInternalError(null); // success!
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsChecking(false);
    }
  };

  const errorMessage = internalError || error;

  return (
    <Field.Root name={name} id={name} error={errorMessage} hint={description ? formatMessage(description) : ''}>
      <Field.Label required={required}>
        {intlLabel ? formatMessage(intlLabel) : name}
      </Field.Label>
      <TextInput
        disabled={disabled}
        id={name}
        name={name}
        onChange={(e) => {
          onChange({
            target: {
              name,
              value: e.target.value,
              type: attribute.type,
            },
          });
          // Reseteamos el error temporal al tipear
          setInternalError(null);
        }}
        onBlur={handleBlur}
        value={value || ''}
        placeholder={isChecking ? 'Comprobando...' : ''}
        aria-invalid={!!errorMessage}
      />
      <Field.Hint />
      <Field.Error />
    </Field.Root>
  );
};

export default CustomPositionInput;