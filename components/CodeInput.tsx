import React from "react";
import {
  NativeSyntheticEvent,
  StyleSheet,
  TextInput,
  TextInputKeyPressEventData,
  TextInputProps,
  View,
  ViewProps,
} from "react-native";
import _ from "lodash";

type CodeInputProps = {
  codeLength: number;
  compareWithCode: string;
  inputPosition: "left" | "right" | "center" | "full-width";
  size: number;
  space: number;
  className:
    | "border-box"
    | "border-circle"
    | "border-b"
    | "border-b-t"
    | "border-l-r"
    | "clear";
  cellBorderWidth: number;
  activeColor: string;
  inactiveColor: string;
  ignoreCase: boolean;
  autoFocus: boolean;
  codeInputStyle: TextInputProps["style"];
  containerStyle: ViewProps["style"];
  onFulfill: (code: string, isMatching?: boolean) => void;
  onCodeChange: (code: string) => void;
  inputProps: TextInputProps;
  style: TextInputProps["style"];
};

type IState = { codeArr: string[]; currentIndex: number };

const CodeInput: React.FC<Partial<CodeInputProps>> = ({
  codeLength = 5,
  inputPosition = "center",
  autoFocus = true,
  size = 40,
  className = "border-box",
  cellBorderWidth = 1,
  activeColor = "#919191",
  inactiveColor = "#E2E2E2",
  space = 8,
  compareWithCode = "",
  ignoreCase,
  onCodeChange,
  onFulfill,
  containerStyle,
  codeInputStyle,
  inputProps,
  style,
}) => {
  const codeInputs = React.useMemo(
    () => [...Array(codeLength).keys()],
    [codeLength]
  );

  const [state, setState] = React.useState<IState>({
    codeArr: new Array(codeLength).fill(""),
    currentIndex: 0,
  });

  const codeInputRefs = React.useRef<TextInput[]>([]);

  React.useEffect(() => {
    if (compareWithCode && compareWithCode.length !== codeLength) {
      console.error(
        "Invalid props: compareWith length is not equal to codeLength"
      );
    }

    if (
      _.indexOf(["center", "left", "right", "full-width"], inputPosition) === -1
    ) {
      console.error(
        "Invalid input position. Must be in: center, left, right, full"
      );
    }
  }, [compareWithCode, codeLength, inputPosition]);

  const inputPositionStyle = INPUT_POSITION_DEFAULT[inputPosition];

  const clear = () => {
    setState((s) => ({
      ...s,
      codeArr: new Array(codeLength).fill(""),
      currentIndex: 0,
    }));
    _setFocus(0);
  };

  const _setFocus = (index: number) => {
    codeInputRefs.current?.[index]?.focus();
  };

  const _blur = (index: number) => {
    codeInputRefs.current?.[index]?.blur();
  };

  const _onFocus = (index: number) => {
    let newCodeArr = _.clone(state.codeArr);
    const currentEmptyIndex = _.findIndex(newCodeArr, (c: string) => !c);
    if (currentEmptyIndex !== -1 && currentEmptyIndex < index) {
      return _setFocus(currentEmptyIndex);
    }
    for (const i in newCodeArr) {
      if (+i >= index) {
        newCodeArr[i] = "";
      }
    }

    setState((s) => ({ ...s, codeArr: newCodeArr, currentIndex: index }));
  };

  const _isMatchingCode = (
    code: string,
    compareCode = "",
    isIgnoreCase = false
  ) => {
    if (isIgnoreCase) {
      return code.toLowerCase() === compareCode.toLowerCase();
    }
    return code === compareCode;
  };

  const _getClassStyle = (
    type: CodeInputProps["className"],
    active: boolean
  ) => {
    const INPUT_SPACE_DEFAULT = {
      left: { marginRight: space },
      center: { marginRight: space / 2, marginLeft: space / 2 },
      right: { marginLeft: space },
      "full-width": { marginRight: 0, marginLeft: 0 },
    };

    let classStyle = {
      ...INPUT_SPACE_DEFAULT[inputPosition],
      color: activeColor,
    };

    const border = {
      clear: { ...classStyle, borderWidth: 0 },
      "border-box": {
        ...classStyle,
        borderWidth: cellBorderWidth,
        borderColor: active ? activeColor : inactiveColor,
        borderRadius: 4,
      },
      "border-circle": {
        ...classStyle,
        borderWidth: cellBorderWidth,
        borderRadius: 50,
        borderColor: active ? activeColor : inactiveColor,
      },
      "border-b": {
        ...classStyle,
        borderBottomWidth: cellBorderWidth,
        borderColor: active ? activeColor : inactiveColor,
        borderRadius: 4,
      },
      "border-b-t": {
        ...classStyle,
        borderTopWidth: cellBorderWidth,
        borderBottomWidth: cellBorderWidth,
        borderColor: active ? activeColor : inactiveColor,
        borderRadius: 4,
      },
      "border-l-r": {
        ...classStyle,
        borderLeftWidth: cellBorderWidth,
        borderRightWidth: cellBorderWidth,
        borderColor: active ? activeColor : inactiveColor,
      },
    };

    return border[type] || border.clear;
  };

  const _onKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === "Backspace") {
      const { currentIndex } = state;
      let newCodeArr = _.clone(state.codeArr);
      const nextIndex = currentIndex > 0 ? currentIndex - 1 : 0;
      for (const i in newCodeArr) {
        if (+i >= nextIndex) {
          newCodeArr[i] = "";
        }
      }
      if (typeof onCodeChange === "function") onCodeChange(newCodeArr.join(""));
      _setFocus(nextIndex);
    }
  };

  const _onInputCode = (character: string, index: number) => {
    let newCodeArr = _.clone(state.codeArr);
    newCodeArr[index] = character;

    if (index === codeLength - 1) {
      const code = newCodeArr.join("");

      if (compareWithCode) {
        const isMatching = _isMatchingCode(
          code,
          compareWithCode || "",
          ignoreCase
        );
        if (typeof onFulfill === "function") onFulfill(code, isMatching);
        !isMatching && clear();
      } else {
        if (typeof onFulfill === "function") onFulfill(code);
      }
      _blur(state.currentIndex);
    } else {
      _setFocus(state.currentIndex + 1);
    }

    setState((prevState) => ({
      ...prevState,
      codeArr: newCodeArr,
      currentIndex: prevState.currentIndex + 1,
    }));
    if (typeof onCodeChange === "function") onCodeChange(newCodeArr.join(""));
  };

  const renderContent = () => {
    const initialCodeInputStyle = {
      width: size,
      height: size,
    };

    return (
      <View
        style={[
          styles.container,
          { height: size },
          inputPositionStyle,
          containerStyle,
        ]}
      >
        {codeInputs.map((index: number) => {
          return (
            <View
              style={[
                initialCodeInputStyle,
                _getClassStyle(className, state.currentIndex === index),
                codeInputStyle,
              ]}
            >
              <TextInput
                key={`${index}`}
                ref={(ref: TextInput) => (codeInputRefs.current[index] = ref)}
                style={[styles.codeInput, style]}
                underlineColorAndroid="transparent"
                selectionColor={activeColor}
                keyboardType="name-phone-pad"
                returnKeyType="done"
                {...inputProps}
                autoFocus={autoFocus && index === 0}
                onFocus={() => _onFocus(index)}
                value={
                  state.codeArr?.[index] ? `${state.codeArr?.[index]}` : ""
                }
                onChangeText={(text) => _onInputCode(text, index)}
                onKeyPress={(e) => _onKeyPress(e)}
                maxLength={1}
                allowFontScaling={false}
                textContentType="oneTimeCode"
              />
            </View>
          );
        })}
      </View>
    );
  };

  return <>{renderContent()}</>;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginVertical: 8,
    // backgroundColor: '#F2F2F2',
  },
  codeInput: {
    backgroundColor: "transparent",
    textAlign: "center",
    padding: 0,
    flex: 1,
  },
  left: { justifyContent: "flex-start" },
  center: { justifyContent: "center" },
  right: { justifyContent: "flex-end" },
  full: { justifyContent: "space-between" },
});

export default React.memo(CodeInput);

const INPUT_POSITION_DEFAULT = {
  left: styles.left,
  center: styles.center,
  right: styles.right,
  "full-width": styles.full,
};
