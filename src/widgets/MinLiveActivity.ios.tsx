import { HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  activityBackgroundTint,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  monospacedDigit,
  padding,
} from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

import type { GlanceProps } from '@/features/widgets/glance-data';

const MinLiveActivity = (props: GlanceProps, environment: LiveActivityEnvironment) => {
  'widget';
  const dark = environment.colorScheme === 'dark';
  const canvas = dark ? '#252A26' : '#F6F4EC';
  const ink = dark ? '#F5F3EB' : '#20221F';
  const secondary = dark ? '#ADB3AA' : '#646862';
  const accent = props.state === 'active' ? '#B5D83D' : '#7882FF';
  const staleLabel = environment.isStale ? 'Obre min per actualitzar' : props.secondary;

  return {
    banner: (
      <VStack
        alignment="leading"
        spacing={8}
        modifiers={[
          activityBackgroundTint(canvas),
          frame({ maxWidth: Infinity, alignment: 'leading' }),
          padding({ all: 16 }),
        ]}>
        <HStack spacing={7}>
          <Image systemName="bolt.fill" size={13} color={accent} />
          <Text modifiers={[font({ weight: 'bold', size: 12 }), foregroundStyle(accent), lineLimit(1)]}>{props.eyebrow}</Text>
          <Spacer />
          <Text modifiers={[font({ weight: 'medium', size: 12 }), foregroundStyle(secondary), lineLimit(1)]}>{props.eventTitle}</Text>
        </HStack>
        <HStack spacing={12}>
          <VStack alignment="leading" spacing={3} modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' })]}>
            <Text modifiers={[font({ weight: 'bold', size: 19 }), foregroundStyle(ink), lineLimit(2)]}>{props.title}</Text>
            <Text modifiers={[font({ size: 12 }), foregroundStyle(secondary), lineLimit(1)]}>{staleLabel}</Text>
          </VStack>
          {props.timeLabel ? (
            <Text modifiers={[font({ weight: 'semibold', size: 15 }), monospacedDigit(), foregroundStyle(ink), lineLimit(1)]}>{props.timeLabel}</Text>
          ) : null}
        </HStack>
      </VStack>
    ),
    compactLeading: <Image systemName="bolt.fill" size={13} color={accent} />,
    compactTrailing: <Text modifiers={[font({ weight: 'semibold', size: 12 }), monospacedDigit(), foregroundStyle('#FFFFFF'), lineLimit(1)]}>{props.timeLabel || 'min'}</Text>,
    minimal: <Image systemName="bolt.fill" size={14} color={accent} />,
    expandedLeading: (
      <HStack spacing={6} modifiers={[padding({ leading: 8 })]}>
        <Image systemName="bolt.fill" size={13} color={accent} />
        <Text modifiers={[font({ weight: 'bold', size: 13 }), foregroundStyle('#FFFFFF'), lineLimit(1)]}>min</Text>
      </HStack>
    ),
    expandedTrailing: (
      <Text modifiers={[font({ weight: 'semibold', size: 13 }), monospacedDigit(), foregroundStyle('#FFFFFF'), lineLimit(1), padding({ trailing: 8 })]}>{props.timeLabel}</Text>
    ),
    expandedBottom: (
      <VStack alignment="leading" spacing={4} modifiers={[padding({ horizontal: 8, bottom: 8 })]}>
        <Text modifiers={[font({ weight: 'bold', size: 16 }), foregroundStyle('#FFFFFF'), lineLimit(2)]}>{props.title}</Text>
        <Text modifiers={[font({ size: 12 }), foregroundStyle('#FFFFFFB3'), lineLimit(1)]}>{staleLabel}</Text>
      </VStack>
    ),
  };
};

export default createLiveActivity<GlanceProps>('MinLiveActivity', MinLiveActivity);
