import React from 'react';

import layout from '@splunk/react-page';
import CiMplicityHome from '@splunk/ci-mplicity-home';
import { getUserTheme } from '@splunk/splunk-utils/themes';

getUserTheme()
    .then((theme) => {
        layout(
            <CiMplicityHome />,
            {
                theme,
            }
        );
    })
    .catch((e) => {
        const errorEl = document.createElement('span');
        errorEl.innerHTML = e;
        document.body.appendChild(errorEl);
    });
