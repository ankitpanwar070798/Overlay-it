import React from 'react';
import { Slider, InputNumber, Form } from 'antd';
import type { TextLayerAttribute } from '../_lib/editor-types';

interface SliderFieldProps {
  attribute: TextLayerAttribute;
  label: string;
  min: number;
  max: number;
  step: number;
  currentValue: number;
  handleAttributeChange: (attribute: TextLayerAttribute, value: number) => void;
}

const SliderField: React.FC<SliderFieldProps> = ({
  attribute,
  label,
  min,
  max,
  step,
  currentValue,
  handleAttributeChange
}) => {

  const handleSliderInputFieldChange = (value: number | null) => {
    if (value !== null) {
      handleAttributeChange(attribute, value);
    }
  };

  return (
    <Form.Item label={label}>
      <div className="flex items-center justify-between">
        {/* Ant Design's InputNumber handles number input */}
        <InputNumber
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={handleSliderInputFieldChange}
        />
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={(value) => handleAttributeChange(attribute, value)}
      />
    </Form.Item>
  );
};

export default SliderField;
