import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  runOnJS,
  interpolate,
  withSpring,
} from 'react-native-reanimated';
import styled from 'styled-components/native';
import { colors, typography, spacing } from '../theme/tokens';

interface SliderPainProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

const Container = styled(View)`
  width: 100%;
  padding: ${spacing.lg}px 0;
`;

const TrackContainer = styled(View)`
  height: 48px;
  justify-content: center;
  margin-bottom: ${spacing.md}px;
`;

const Track = styled(View)`
  height: 8px;
  background-color: ${colors.cardBorder};
  border-radius: 8px;
  position: relative;
`;

const ActiveTrack = styled(Animated.View)`
  height: 8px;
  background-color: ${colors.accent};
  border-radius: 8px;
  position: absolute;
  top: 0;
  left: 0;
`;

const ThumbContainer = styled(Animated.View)`
  position: absolute;
  top: -14px;
  width: 36px;
  height: 36px;
  justify-content: center;
  align-items: center;
`;

const Thumb = styled(View)`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: #FFFFFF;
  border-width: 4px;
  border-color: ${colors.accent};
  shadow-color: ${colors.shadow};
  shadow-offset: 0px 2px;
  shadow-opacity: 1;
  shadow-radius: 4px;
  elevation: 4;
`;

const ValueBubble = styled(Animated.View)`
  position: absolute;
  top: -44px;
  width: 32px;
  height: 24px;
  background-color: ${colors.accent};
  border-radius: 12px;
  justify-content: center;
  align-items: center;
`;

const BubbleText = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: 14px;
  font-weight: 600;
  color: #FFFFFF;
`;

const TicksContainer = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  margin-top: ${spacing.sm}px;
  padding-horizontal: 18px;
`;

const TickMark = styled(View)`
  width: 2px;
  height: 8px;
  background-color: ${colors.cardBorder};
`;

const TickLabel = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.caption.size}px;
  font-weight: ${typography.caption.weight};
  color: ${colors.textSecondary};
  margin-top: ${spacing.xs}px;
  text-align: center;
`;

export const SliderPain: React.FC<SliderPainProps> = ({
  value,
  onValueChange,
  min = 0,
  max = 10,
  step = 0.5,
}) => {
  const [sliderWidth, setSliderWidth] = useState(0);
  const translateX = useSharedValue(0);
  const showBubble = useSharedValue(0);

  useEffect(() => {
    if (sliderWidth > 0) {
      const percentage = (value - min) / (max - min);
      translateX.value = withSpring(percentage * (sliderWidth - 36));
    }
  }, [value, sliderWidth, min, max]);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      showBubble.value = withSpring(1);
    },
    onActive: (event) => {
      const percentage = Math.max(0, Math.min(1, event.x / (sliderWidth - 36)));
      translateX.value = percentage * (sliderWidth - 36);
      
      const newValue = min + percentage * (max - min);
      const steppedValue = Math.round(newValue / step) * step;
      
      runOnJS(onValueChange)(Math.max(min, Math.min(max, steppedValue)));
    },
    onEnd: () => {
      showBubble.value = withSpring(0);
    },
  });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: showBubble.value,
    transform: [
      { translateX: translateX.value },
      { translateY: interpolate(showBubble.value, [0, 1], [6, 0]) },
    ],
  }));

  const activeTrackStyle = useAnimatedStyle(() => ({
    width: translateX.value + 18,
  }));

  const ticks = [];
  for (let i = min; i <= max; i += 1) {
    ticks.push(i);
  }

  return (
    <Container>
      <TrackContainer
        onLayout={(event) => {
          setSliderWidth(event.nativeEvent.layout.width);
        }}
      >
        <Track>
          <ActiveTrack style={activeTrackStyle} />
        </Track>
        
        <ValueBubble style={bubbleStyle}>
          <BubbleText>{value.toFixed(1)}</BubbleText>
        </ValueBubble>
        
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <ThumbContainer style={thumbStyle}>
            <Thumb />
          </ThumbContainer>
        </PanGestureHandler>
      </TrackContainer>
      
      <TicksContainer>
        {ticks.map((tick) => (
          <View key={tick} style={{ alignItems: 'center' }}>
            <TickMark />
            <TickLabel>{tick}</TickLabel>
          </View>
        ))}
      </TicksContainer>
    </Container>
  );
};