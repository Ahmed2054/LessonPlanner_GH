import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

const FormattingToolbar = ({ onInsert }) => (
    <View style={styles.toolbar}>
      <TouchableOpacity onPress={() => onInsert('<b>', '</b>')} style={styles.toolbarBtn}>
        <Text style={styles.toolbarBtnText}>B</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onInsert('<i>', '</i>')} style={styles.toolbarBtn}>
        <Text style={[styles.toolbarBtnText, { fontStyle: 'italic' }]}>I</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onInsert('<ul><li>', '</li></ul>')} style={styles.toolbarBtn}>
        <Text style={styles.toolbarBtnText}>• List</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onInsert('<ol><li>', '</li></ol>')} style={styles.toolbarBtn}>
        <Text style={styles.toolbarBtnText}>1. List</Text>
      </TouchableOpacity>
    </View>
);

const styles = StyleSheet.create({
    toolbar: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        backgroundColor: '#f0f4ff', 
        padding: 5, 
        borderTopLeftRadius: 8, 
        borderTopRightRadius: 8, 
        borderBottomWidth: 1, 
        borderBottomColor: '#d0d9ff' 
    },
    toolbarBtn: { 
        padding: 8, 
        marginRight: 5, 
        marginBottom: 2, 
        backgroundColor: '#fff', 
        borderRadius: 4, 
        minWidth: 35, 
        alignItems: 'center', 
        borderWidth: 1, 
        borderColor: '#cad5ff' 
    },
    toolbarBtnText: { 
        fontSize: 12, 
        fontWeight: 'bold', 
        color: COLORS.primary 
    },
});

export default FormattingToolbar;
