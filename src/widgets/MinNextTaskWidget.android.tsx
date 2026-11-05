import { Column, Row, Spacer, Text } from '@expo/ui/jetpack-compose';
import {
  background,
  cornerRadius,
  fillMaxSize,
  height,
  paddingAll,
} from '@expo/ui/jetpack-compose/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { GlanceProps } from '@/features/widgets/glance-data';

const MinNextTaskWidget = (props: GlanceProps, environment: WidgetEnvironment) => {
  'widget';
  const dark = environment.colorScheme === 'dark';
  const canvas = dark ? '#252A26' : '#F6F4EC';
  const ink = dark ? '#F5F3EB' : '#20221F';
  const secondary = dark ? '#ADB3AA' : '#646862';
  const accent = props.state === 'active' ? '#B5D83D' : dark ? '#9DA4FF' : '#3947F5';
  return (
    <Column
      horizontalAlignment="start"
      verticalArrangement="spaceBetween"
      modifiers={[fillMaxSize(), background(canvas), cornerRadius(24), paddingAll(16)]}>
      <Row horizontalArrangement="spaceBetween" verticalAlignment="center">
        <Text color={accent} maxLines={1} style={{ fontSize: 12, fontWeight: '700', letterSpacing: 0.4 }}>{props.eyebrow}</Text>
        <Text color={secondary} maxLines={1} style={{ fontSize: 12 }}>{props.eventTitle}</Text>
      </Row>
      <Spacer modifiers={[height(8)]} />
      {props.timeLabel ? <Text color={secondary} maxLines={1} style={{ fontSize: 14, fontWeight: '600' }}>{props.timeLabel}</Text> : null}
      <Text color={ink} maxLines={2} overflow="ellipsis" style={{ fontSize: 20, fontWeight: '700', lineHeight: 23 }}>{props.title}</Text>
      <Spacer modifiers={[height(6)]} />
      <Text color={secondary} maxLines={1} overflow="ellipsis" style={{ fontSize: 12 }}>{props.secondary}</Text>
    </Column>
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
