import * as React from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';

export const RoundButton = ({
  onPress,
  backgroundColor,
  buttonText,
  disabled,
}: {
  onPress: () => void;
  backgroundColor: string;
  buttonText: string;
  disabled: boolean;
}) => {
  return (
    <View style={styles.container}>
      <Pressable
        disabled={disabled}
        onPress={onPress}
        style={[styles.button, { backgroundColor: backgroundColor }]}
      >
        <Text style={styles.buttonText}>{buttonText}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});
