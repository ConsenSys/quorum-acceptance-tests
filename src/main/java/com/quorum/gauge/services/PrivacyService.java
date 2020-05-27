/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package com.quorum.gauge.services;

import com.quorum.gauge.common.QuorumNetworkProperty;
import com.quorum.gauge.common.QuorumNode;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

@Service
public class PrivacyService extends AbstractService {

    public String id(QuorumNode node) {
        String privacyAddress = getQuorumNodeConfig(node).getPrivacyAddress();
        if (StringUtils.isEmpty(privacyAddress)) {
            if (getQuorumNodeConfig(node).getPrivacyAddress().isEmpty()) {
                throw new RuntimeException("no privacy address is configured");
            }
            privacyAddress = getQuorumNodeConfig(node).getPrivacyAddress();
            return privacyAddress;
        }
        QuorumNetworkProperty.Node quorumNodeConfig = getQuorumNodeConfig(node);
        String v = quorumNodeConfig.getPrivacyAddress();
        if (StringUtils.isEmpty(v)) {
            if (quorumNodeConfig.getPrivacyAddressAliases().isEmpty()) {
                throw new RuntimeException("no privacy address is defined for node: " + node);
            }
            v = quorumNodeConfig.getPrivacyAddressAliases().values().iterator().next();
        }
        return v;
    }

    public String id(QuorumNetworkProperty.Node node, String alias) {
        if (node.getPrivacyAddressAliases().containsKey(alias)) {
            return node.getPrivacyAddressAliases().get(alias);
        }
        throw new RuntimeException("private address alias not found: " + alias);
    }

    public String id(String alias) {
        List<String> matches = new ArrayList<>();
        for (QuorumNetworkProperty.Node node : networkProperty().getNodes().values()) {
            if (node.getPrivacyAddressAliases().containsKey(alias)) {
                matches.add(node.getPrivacyAddressAliases().get(alias));
            }
        }
        if (matches.size() == 0) {
            throw new RuntimeException("private address alias not found: " + alias);
        }
        if (matches.size() > 1) {
            throw new RuntimeException("there are " + matches.size() + " nodes having this privacy address alias: " + alias);
        }
        return matches.get(0);
    }

    public String thirdPartyUrl(QuorumNode node) {
        return getQuorumNodeConfig(node).getThirdPartyUrl();
    }

    private QuorumNetworkProperty.Node getQuorumNodeConfig(QuorumNode node) {
        QuorumNetworkProperty.Node nodeConfig = networkProperty().getNodes().get(node);
        if (nodeConfig == null) {
            throw new IllegalArgumentException("Node " + node + " not found in config");
        }
        return nodeConfig;
    }

}
