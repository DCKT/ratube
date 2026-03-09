import {
  TabList,
  TabListProps,
  Tabs,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
} from 'expo-router/ui';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MaxContentWidth } from '@/constants/theme';
import { useScreenDimensions } from '@/hooks/use-screen-dimensions';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="search" href="/search" asChild>
            <TabButton>Search</TabButton>
          </TabTrigger>
          <TabTrigger name="settings" href="/settings" asChild>
            <TabButton>Settings</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  children,
  isFocused,
  ...props
}: TabTriggerSlotProps) {
  const styles = useTabStyles();
  return (
    <Pressable
      {...props}
      style={({ pressed, focused, hovered }) =>
        (pressed || focused || hovered) && styles.pressed
      }
    >
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.tabButtonView}
      >
        <ThemedText
          type="small"
          themeColor={isFocused ? 'text' : 'textSecondary'}
        >
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const styles = useTabStyles();

  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        <ThemedText type="smallBold" style={styles.brandText}>
          InvidiousTV
        </ThemedText>

        {props.children}
      </ThemedView>
    </View>
  );
}

const useTabStyles = () => {
  const { spacing } = useScreenDimensions();
  return StyleSheet.create({
    tabListContainer: {
      position: 'absolute',
      width: '100%',
      padding: spacing.three,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    },
    innerContainer: {
      paddingVertical: spacing.two,
      paddingHorizontal: spacing.five,
      borderRadius: spacing.five,
      flexDirection: 'row',
      alignItems: 'center',
      flexGrow: 1,
      gap: spacing.two,
      maxWidth: MaxContentWidth,
    },
    brandText: {
      marginRight: 'auto',
    },
    pressed: {
      opacity: 0.7,
    },
    tabButtonView: {
      paddingVertical: spacing.one,
      paddingHorizontal: spacing.three,
      borderRadius: spacing.three,
    },
  });
};
