/**
 *
 * Toggle
 *
 */

import React from 'react';
import PropTypes from 'prop-types';

import { Toggle as StyledToggle, ToggleWrapper } from '@buffetjs/styles';
import { Label } from '@buffetjs/core';

function Toggle({ disabled, id, className, name, onChange, value }) {
    return (
        <ToggleWrapper className={className}>
            <Label htmlFor={id || name}>
                <StyledToggle
                    disabled={disabled}
                    checked={value}
                    id={id || name}
                    name={id || name}
                    onChange={e => {
                        onChange({ target: { name, value: e.target.checked } });
                    }}
                />
                <span>FALSE</span>
                <span>TRUE</span>
            </Label>
        </ToggleWrapper>
    );
}

export default Toggle;