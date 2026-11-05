import { HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  containerBackground,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  monospacedDigit,
  padding,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { GlanceProps } from '@/features/widgets/glance-data';

const MinNextTaskWidget = (props: GlanceProps, environment: WidgetEnvironment) => {
  'widget';
  const accessory = environment.widgetFamily === 'accessoryRectangular';
  const dark = environment.colorScheme === 'dark';
  const fullColor = environment.widgetRenderingMode == null || environment.widgetRenderingMode === 'fullColor';
  const background = fullColor ? (dark ? '#252A26' : '#F6F4EC') : '#00000000';
  const ink = fullColor ? (dark ? '#F5F3EB' : '#20221F') : '#FFFFFF';
  const secondary = fullColor ? (dark ? '#ADB3AA' : '#646862') : '#FFFFFFB3';
  const accent = fullColor ? (props.state === 'active' ? '#D8FA67' : '#7882FF') : '#FFFFFF';

  if (accessory) {
    return (
      <VStack
        alignment="leading"
        spacing={2}
        modifiers={[
          containerBackground(background, 'widget'),
          frame({ maxWidth: Infinity, alignment: 'leading' }),
          widgetURL(props.url),
        ]}>
        <HStack spacing={5}>
          <Image systemName={props.state === 'active' ? 'bolt.fill' : 'clock.fill'} size={11} color={accent} />
          <Text modifiers={[font({ weight: 'semibold', size: 11 }), foregroundStyle(secondary), lineLimit(1)]}>
            {props.timeLabel || props.eyebrow}
          </Text>
        </HStack>
        <Text modifiers={[font({ weight: 'bold', size: 15 }), foregroundStyle(ink), lineLimit(2)]}>{props.title}</Text>
      </VStack>
    );
  }

  return (
    <VStack
      alignment="leading"
      spacing={8}
      modifiers={[
        containerBackground(background, 'widget'),
        frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'leading' }),
        padding({ all: 16 }),
        widgetURL(props.url),
      ]}>
      <HStack spacing={6}>
        <Image systemName={props.state === 'active' ? 'bolt.fill' : 'sparkles'} size={12} color={accent} />
        <Text modifiers={[font({ weight: 'bold', size: 11 }), foregroundStyle(accent), lineLimit(1)]}>{props.eyebrow}</Text>
        <Spacer />
        <Text modifiers={[font({ weight: 'medium', size: 11 }), foregroundStyle(secondary), lineLimit(1)]}>{props.eventTitle}</Text>
      </HStack>
      <Spacer />
      {props.timeLabel ? (
        <Text modifiers={[font({ weight: 'semibold', size: 15 }), monospacedDigit(), foregroundStyle(secondary), lineLimit(1)]}>
          {props.timeLabel}
        </Text>
      ) : null}
      <Text modifiers={[font({ weight: 'bold', size: environment.widgetFamily === 'systemSmall' ? 19 : 22 }), foregroundStyle(ink), lineLimit(2)]}>
        {props.title}
      </Text>
      {environment.widgetFamily !== 'systemSmall' ? (
        <Text modifiers={[font({ size: 12 }), foregroundStyle(secondary), lineLimit(1)]}>{props.secondary}</Text>
      ) : null}
    </VStack>
  );
};

export default createWidget<GlanceProps>('MinNextTaskWidget', MinNextTaskWidget, {
  documentId: '',
  eventTitle: 'min',
  state: 'empty',
  eyebrow: 'TOT AL SEU MOMENT',
  title: 'Obre min per preparar el teu dia',
  timeLabel: '',
  secondary: 'Les dades es desen al dispositiu.',
  url: 'min://app',
});
