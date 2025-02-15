/**
 * Created by sohobloo on 16/9/13.
 */

'use strict';

import React, {
    Component,
} from 'react';

import {
    StyleSheet,
    Dimensions,
    View,
    Text,
    FlatList,
    TouchableWithoutFeedback,
    TouchableNativeFeedback,
    TouchableOpacity,
    TouchableHighlight,
    Modal,
    ActivityIndicator,
} from 'react-native';

import PropTypes from 'prop-types';

const TOUCHABLE_ELEMENTS = [
    'TouchableHighlight',
    'TouchableOpacity',
    'TouchableWithoutFeedback',
    'TouchableNativeFeedback'
];

export default class ModalDropdown extends Component {
    static propTypes = {
        disabled: PropTypes.bool,
        scrollEnabled: PropTypes.bool,
        defaultIndex: PropTypes.number,
        defaultValue: PropTypes.string,
        options: PropTypes.array,

        accessible: PropTypes.bool,
        animated: PropTypes.bool,
        showsVerticalScrollIndicator: PropTypes.bool,
        keyboardShouldPersistTaps: PropTypes.string,

        style: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.array]),
        backgroundColorHighlight: PropTypes.string,
        textStyle: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.array]),
        dropdownStyle: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.array]),
        dropdownTextStyle: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.array]),
        dropdownTextHighlightStyle: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.array]),
        dropdownAutoWidth: PropTypes.bool,

        adjustFrame: PropTypes.func,
        renderRow: PropTypes.func,
        renderSeparator: PropTypes.func,
        renderButtonText: PropTypes.func,
        renderButtonIcon: PropTypes.func,

        onDropdownWillShow: PropTypes.func,
        onDropdownWillHide: PropTypes.func,
        onSelect: PropTypes.func,

        buttonOpacity: PropTypes.number
    };

    static defaultProps = {
        style: {},
        disabled: false,
        scrollEnabled: true,
        defaultIndex: -1,
        defaultValue: 'Please select...',
        options: null,
        animated: true,
        showsVerticalScrollIndicator: true,
        keyboardShouldPersistTaps: 'never',
        dropdownAutoWidth: false,
        buttonOpacity: 0.2,
        backgroundColorHighlight: 'transparent',
    };

    constructor(props) {
        super(props);

        this._button = null;
        this._buttonFrame = null;

        this.state = {
            accessible: !!props.accessible,
            loading: !props.options,
            showDropdown: false,
            buttonText: props.defaultValue,
            selectedIndex: props.defaultIndex
        };
    }

    static getDerivedStateFromProps(props, state) {
        let {buttonText, selectedIndex} = state;
        const {defaultIndex, defaultValue, options} = props;
        if (selectedIndex < 0) {
            selectedIndex = defaultIndex;
            if (selectedIndex < 0) {
                buttonText = defaultValue;
            }
        }
        return {
            loading: !options,
            buttonText,
            selectedIndex
        }
    }

    render() {
        return (
            <View {...this.props}>
                {this._renderButton()}
                {this._renderModal()}
            </View>
        );
    }

    _updatePosition(callback) {
        if (this._button && this._button.measure) {
            this._button.measure((fx, fy, width, height, px, py) => {
                this._buttonFrame = {x: px, y: py, w: width, h: height};
                callback && callback();
            });
        }
    }

    show() {
        this._updatePosition(() => {
            this.setState({
                showDropdown: true
            });
        });
    }

    hide() {
        this.setState({
            showDropdown: false
        });
    }

    select(idx) {
        const {defaultValue, options, defaultIndex, renderButtonText} = this.props;

        let value = defaultValue;
        if (idx == null || !options || idx >= options.length) {
            idx = defaultIndex;
        }

        if (idx >= 0) {
            value = renderButtonText ? renderButtonText(options[idx]) : options[idx].toString();
        }


        this.setState({
            buttonText: value,
            selectedIndex: idx
        });
    }

    _renderButton() {
        const {disabled, accessible, children, textStyle, buttonOpacity, renderButtonIcon, backgroundColorHighlight} = this.props;
        const {buttonText, showDropdown} = this.state;

        const backgroundColor = showDropdown ? backgroundColorHighlight : 'transparent';

        return (
            <TouchableOpacity ref={button => this._button = button}
                              disabled={disabled}
                              accessible={accessible}
                              onPress={this._onButtonPress}
                              activeOpacity={buttonOpacity}
            >
                {
                    children ||
                    (
                        <View style={[styles.button, {backgroundColor: backgroundColor}]}>
                            <Text style={[styles.buttonText, textStyle]}
                                  numberOfLines={1}
                            >
                                {buttonText}
                            </Text>
                            {renderButtonIcon && renderButtonIcon(showDropdown)}
                        </View>
                    )
                }
            </TouchableOpacity>
        );
    }

    _onButtonPress = () => {
        const {onDropdownWillShow} = this.props;
        if (!onDropdownWillShow ||
            onDropdownWillShow() !== false) {
            this.show();
        }
    };

    _renderModal() {
        const {animated, accessible, dropdownStyle} = this.props;
        const {showDropdown, loading} = this.state;
        if (showDropdown && this._buttonFrame) {
            const frameStyle = this._calcPosition();
            const animationType = animated ? 'fade' : 'none';
            return (
                <Modal animationType={animationType}
                       visible={true}
                       transparent={true}
                       onRequestClose={this._onRequestClose}
                       supportedOrientations={['portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right']}
                >
                    <TouchableWithoutFeedback accessible={accessible}
                                              disabled={!showDropdown}
                                              onPress={this._onModalPress}
                    >
                        <View style={styles.modal}>
                            <View style={[styles.dropdown, dropdownStyle, frameStyle]}>
                                {loading ? this._renderLoading() : this._renderDropdown()}
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            );
        }
    }

    _calcPosition() {
        const {dropdownStyle, style, adjustFrame, dropdownAutoWidth} = this.props;

        const dimensions = Dimensions.get('window');
        const windowWidth = dimensions.width;
        const windowHeight = dimensions.height;

        const dropdownHeight = (dropdownStyle && StyleSheet.flatten(dropdownStyle).height) ||
            StyleSheet.flatten(styles.dropdown).height;

        const bottomSpace = windowHeight - this._buttonFrame.y - this._buttonFrame.h;
        const rightSpace = windowWidth - this._buttonFrame.x;
        const showInBottom = bottomSpace >= dropdownHeight || bottomSpace >= this._buttonFrame.y;
        const showInLeft = rightSpace >= this._buttonFrame.x;

        const leftOffset = (style.borderWidth || 0) + (style.paddingLeft || style.paddingHorizontal || style.padding || 0);
        const bottomOffset = (style.borderWidth || 0) + (style.paddingBottom || style.paddingVertica || style.padding || 0);

        const positionStyle = {
            height: dropdownHeight,
            top: showInBottom ? this._buttonFrame.y + this._buttonFrame.h + bottomOffset : Math.max(0, this._buttonFrame.y - dropdownHeight),
        };

        if (showInLeft) {
            positionStyle.left = this._buttonFrame.x - leftOffset;
        } else {
            const dropdownWidth = (dropdownStyle && StyleSheet.flatten(dropdownStyle).width) ||
                (style && StyleSheet.flatten(style).width) || -1;
            if (dropdownWidth !== -1) {
                positionStyle.width = dropdownWidth;
            }
            positionStyle.right = rightSpace - this._buttonFrame.w;
        }

        if (dropdownAutoWidth) {
            positionStyle.width = this._buttonFrame.w;
        }

        return adjustFrame ? adjustFrame(positionStyle) : positionStyle;
    }

    _onRequestClose = () => {
        const {onDropdownWillHide} = this.props;
        if (!onDropdownWillHide ||
            onDropdownWillHide() !== false) {
            this.hide();
        }
    };

    _onModalPress = () => {
        const {onDropdownWillHide} = this.props;
        if (!onDropdownWillHide ||
            onDropdownWillHide() !== false) {
            this.hide();
        }
    };

    _renderLoading() {
        return (
            <ActivityIndicator size='small'/>
        );
    }

    _renderDropdown() {
        const {scrollEnabled, renderSeparator, showsVerticalScrollIndicator, keyboardShouldPersistTaps, keyExtractor} = this.props;
        return (
            <FlatList scrollEnabled={scrollEnabled}
                      style={styles.list}
                      data={this._dataSource}
                      renderItem={this._renderRow}
                      keyExtractor={keyExtractor}
                      automaticallyAdjustContentInsets={false}
                      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
                      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
            />
        );
    }

    get _dataSource() {
        const {options} = this.props;
        return options;
    }

    _renderRow = ({ item: rowData, index: rowID}) => {
        const {renderRow, dropdownTextStyle, dropdownTextHighlightStyle, accessible} = this.props;
        const {selectedIndex} = this.state;
        const key = `row_${rowID}`;
        const highlighted = rowID == selectedIndex;
        const row = !renderRow ?
            (<Text style={[
                styles.rowText,
                dropdownTextStyle,
                highlighted && styles.highlightedRowText,
                highlighted && dropdownTextHighlightStyle
            ]}
            >
                {rowData}
            </Text>) :
            renderRow(rowData, rowID, highlighted);
        const preservedProps = {
            key,
            accessible,
            onPress: () => this._onRowPress(rowData, rowID),
        };
        if (TOUCHABLE_ELEMENTS.find(name => name == row.type.displayName)) {
            const props = {...row.props};
            props.key = preservedProps.key;
            props.onPress = preservedProps.onPress;
            const {children} = row.props;
            switch (row.type.displayName) {
                case 'TouchableHighlight': {
                    return (
                        <TouchableHighlight {...props}>
                            {children}
                        </TouchableHighlight>
                    );
                }
                case 'TouchableOpacity': {
                    return (
                        <TouchableOpacity {...props}>
                            {children}
                        </TouchableOpacity>
                    );
                }
                case 'TouchableWithoutFeedback': {
                    return (
                        <TouchableWithoutFeedback {...props}>
                            {children}
                        </TouchableWithoutFeedback>
                    );
                }
                case 'TouchableNativeFeedback': {
                    return (
                        <TouchableNativeFeedback {...props}>
                            {children}
                        </TouchableNativeFeedback>
                    );
                }
                default:
                    break;
            }
        }
        return (
            <TouchableHighlight {...preservedProps}>
                {row}
            </TouchableHighlight>
        );
    };

    _onRowPress(rowData, rowID) {
        const {onSelect, renderButtonText, onDropdownWillHide} = this.props;
        if (!onSelect || onSelect(rowID, rowData) !== false) {
            const value = renderButtonText && renderButtonText(rowData) || rowData.toString();
            this.setState({
                buttonText: value,
                selectedIndex: rowID
            });
        }
        if (!onDropdownWillHide || onDropdownWillHide() !== false) {
            this.setState({
                showDropdown: false
            });
        }
    }

    _renderSeparator = (sectionID, rowID, adjacentRowHighlighted) => {
        const key = `spr_${rowID}`;
        return (
            <View style={styles.separator}
                  key={key}
            />
        );
    };
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 12
    },
    modal: {
        flexGrow: 1
    },
    dropdown: {
        position: 'absolute',
        height: (33 + StyleSheet.hairlineWidth) * 5,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'lightgray',
        borderRadius: 2,
        backgroundColor: 'white',
        justifyContent: 'center'
    },
    loading: {
        alignSelf: 'center'
    },
    list: {
        shadowRadius: 3,
        shadowColor: '#5d5d5d',
        elevation: 5,
    },
    rowText: {
        paddingHorizontal: 6,
        paddingVertical: 10,
        fontSize: 11,
        color: 'gray',
        backgroundColor: 'white',
        textAlignVertical: 'center'
    },
    highlightedRowText: {
        color: 'black'
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'lightgray'
    }
});
