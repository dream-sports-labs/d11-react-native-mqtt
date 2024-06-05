import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

export const RoundButton = ({
  onPress,
  backgroundColor,
  buttonText,
}: {
  onPress: () => void;
  backgroundColor: string;
  buttonText: string;
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ ...styles.button, backgroundColor: backgroundColor }}
    >
      <Text style={styles.buttonText}>{buttonText}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});
