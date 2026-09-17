import { ColorArea, ColorField, ColorPicker, ColorSlider, ColorSwatch, ColorSwatchPicker, Input, Label, parseColor } from '@heroui/react';
import { useI18n } from '@/i18n';

interface ColorPickerFieldProps {
  label: string;
  /** #rrggbb */
  value: string;
  onChange: (hex: string) => void;
  /** Quick picks shown as swatches. */
  presets?: string[];
  description?: string;
}

/**
 * Accessible colour picker (HeroUI / React Aria): trigger swatch + popover with a saturation/brightness
 * area, hue slider, hex field and preset swatches. Every part is keyboard operable and announces its value.
 */
export function ColorPickerField({ label, value, onChange, presets = [], description }: ColorPickerFieldProps) {
  const { t } = useI18n();
  const color = parseColor(value).toFormat('hsb');
  const emit = (next: { toString: (format: 'hex') => string }) => onChange(next.toString('hex').toLowerCase());

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      {description && <p className="text-sm text-muted">{description}</p>}
      <ColorPicker value={color} onChange={emit}>
        <ColorPicker.Trigger
          aria-label={t('common.color.open', { label })}
          className="flex w-fit items-center gap-3 rounded-2xl border border-border bg-surface py-2 pe-4 ps-2 text-sm hover:bg-default-soft"
        >
          <ColorSwatch className="size-8 rounded-xl" />
          <span className="font-mono uppercase">{value}</span>
        </ColorPicker.Trigger>
        <ColorPicker.Popover className="grid w-64 gap-3 rounded-2xl p-3">
          <ColorArea aria-label={t('common.color.area')} colorSpace="hsb" xChannel="saturation" yChannel="brightness" className="h-40 rounded-xl">
            <ColorArea.Thumb />
          </ColorArea>
          <ColorSlider colorSpace="hsb" channel="hue" className="grid gap-1">
            <Label className="text-xs text-muted">{t('common.color.hue')}</Label>
            <ColorSlider.Track>
              <ColorSlider.Thumb />
            </ColorSlider.Track>
          </ColorSlider>
          <ColorField className="grid gap-1">
            <Label className="text-xs text-muted">{t('common.color.hex')}</Label>
            <Input className="font-mono" />
          </ColorField>
          {presets.length > 0 && (
            <ColorSwatchPicker className="flex flex-wrap gap-1.5" aria-label={t('common.color.presets')}>
              {presets.map((preset) => (
                <ColorSwatchPicker.Item key={preset} color={preset} className="rounded-lg">
                  <ColorSwatchPicker.Swatch className="size-7 rounded-lg" />
                </ColorSwatchPicker.Item>
              ))}
            </ColorSwatchPicker>
          )}
        </ColorPicker.Popover>
      </ColorPicker>
    </div>
  );
}
