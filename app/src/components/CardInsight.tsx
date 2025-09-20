import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import styled from 'styled-components/native';
import { LineChart } from 'react-native-chart-kit';
import { colors, typography, spacing, radii, shadows } from '../theme/tokens';
import { ChartDataset } from '../types/db';

interface CardInsightProps {
  title: string;
  value: string | number;
  subtitle?: string;
  chartData?: ChartDataset;
  chartColor?: string;
}

const Container = styled(View)`
  background-color: ${colors.surface};
  border-radius: ${radii.lg}px;
  padding: ${spacing.lg}px;
  margin-bottom: ${spacing.md}px;
  shadow-color: ${colors.shadow};
  shadow-offset: 0px 6px;
  shadow-opacity: 1;
  shadow-radius: 16px;
  elevation: 6;
`;

const Title = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.h3.size}px;
  font-weight: ${typography.h3.weight};
  line-height: ${typography.h3.lineHeight}px;
  color: ${colors.textSecondary};
  margin-bottom: ${spacing.xs}px;
`;

const Value = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: 40px;
  font-weight: 700;
  line-height: 48px;
  color: ${colors.textPrimary};
  margin-bottom: ${spacing.xs}px;
`;

const Subtitle = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.small.size}px;
  font-weight: ${typography.small.weight};
  line-height: ${typography.small.lineHeight}px;
  color: ${colors.textSecondary};
  margin-bottom: ${spacing.md}px;
`;

const ChartContainer = styled(View)`
  height: 120px;
  margin-top: ${spacing.sm}px;
`;

export const CardInsight: React.FC<CardInsightProps> = ({
  title,
  value,
  subtitle,
  chartData,
  chartColor = colors.accent,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth * 0.92 - (spacing.lg * 2);

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    decimalPlaces: 1,
    color: (opacity = 1) => chartColor === colors.danger 
      ? `rgba(255, 77, 109, ${opacity})` 
      : `rgba(6, 199, 195, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 0,
    },
    propsForDots: {
      r: '3',
      strokeWidth: '2',
      stroke: chartColor,
    },
    propsForBackgroundLines: {
      strokeWidth: 1,
      stroke: colors.cardBorder,
    },
  };

  const data = chartData ? {
    labels: chartData.labels,
    datasets: [
      {
        data: chartData.values.length > 0 ? chartData.values : [0],
        color: (opacity = 1) => chartColor === colors.danger 
          ? `rgba(255, 77, 109, ${opacity})` 
          : `rgba(6, 199, 195, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  } : null;

  return (
    <Container>
      <Title>{title}</Title>
      <Value>{value}</Value>
      {subtitle && <Subtitle>{subtitle}</Subtitle>}
      
      {data && (
        <ChartContainer>
          <LineChart
            data={data}
            width={chartWidth}
            height={120}
            chartConfig={chartConfig}
            bezier
            style={{
              marginLeft: -spacing.md,
            }}
            withDots={true}
            withShadow={false}
            withVerticalLabels={false}
            withHorizontalLabels={false}
            withInnerLines={false}
            withOuterLines={false}
            withVerticalLines={false}
            withHorizontalLines={false}
          />
        </ChartContainer>
      )}
    </Container>
  );
};