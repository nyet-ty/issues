import React from 'react';
import styled from 'styled-components';
import { Input, useInput, Grid } from '@geist-ui/core';

import { buttonIconColor, searchBarBackground } from '../design/@generated/themes';

import { Icon } from './Icon';

interface SearchBarProps {}

const StyledSearchBar = styled.div`
    padding: 8px 20px 4px 20px;
    background-color: ${searchBarBackground};
`;

export const SearchBar: React.FC<SearchBarProps> = () => {
    const { state: inputState, reset: inputReset, bindings: inputBingings } = useInput('');

    return (
        <StyledSearchBar>
            <Grid.Container gap={0}>
                <Grid xs={1} />
                <Grid xs={23}>
                    <Input
                        scale={0.6}
                        width="240px"
                        autoFocus
                        icon={
                            // FIXME: https://github.com/taskany-inc/goals/issues/14
                            <span style={{ display: 'inline-block', position: 'relative', top: '1px' }}>
                                <Icon type="search" size="xs" color={buttonIconColor} />
                            </span>
                        }
                        {...inputBingings}
                    />
                </Grid>
            </Grid.Container>
        </StyledSearchBar>
    );
};
