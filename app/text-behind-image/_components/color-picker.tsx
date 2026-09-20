import React from 'react';
import { Button, Dropdown, Tabs, Menu, Row, Col } from 'antd';
import { ChromePicker, ColorResult } from 'react-color';
import { colors } from './colors';
import type { TextLayerAttribute } from '../_lib/editor-types';

interface ColorPickerProps {
  attribute: TextLayerAttribute;
  label: string;
  currentColor: string;
  handleAttributeChange: (attribute: TextLayerAttribute, value: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  attribute,
  label,
  currentColor,
  handleAttributeChange,
}) => {
  const menu = (
    <Menu>
      <Menu.Item key="1">
        <Tabs defaultActiveKey="colorPicker" style={{ width: 240 }}>
          <Tabs.TabPane tab="🎨" key="colorPicker">
            <ChromePicker
              color={currentColor}
              onChange={(color: ColorResult) => handleAttributeChange(attribute, color.hex)}
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab="⚡️" key="suggestions">
            <Row gutter={[8, 8]} style={{ marginTop: '8px' }}>
              {colors.map((color) => (
                <Col key={color} span={6}>
                  <div
                    style={{
                      backgroundColor: color,
                      width: '100%',
                      height: '24px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                    }}
                    onClick={() => handleAttributeChange(attribute, color)}
                  />
                </Col>
              ))}
            </Row>
          </Tabs.TabPane>
        </Tabs>
      </Menu.Item>
    </Menu>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label htmlFor={attribute}>{label}</label>
      <Dropdown overlay={menu} trigger={['click']} placement="bottomLeft">
        <Button style={{ width: 'fit-content' }}>
          <div
            style={{
              backgroundColor: currentColor,
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              marginRight: '8px',
              border: '1px solid #ccc0c0',
              display: 'inline-block',
            }}
          />
          {currentColor}
        </Button>
      </Dropdown>
    </div>
  );
};

export default ColorPicker;
