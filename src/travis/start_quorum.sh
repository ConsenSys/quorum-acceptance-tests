#!/bin/bash

TERRAFORM_CMD=${TERRAFORM_CMD:-terraform}
# Read all IPs that travis VMs might have to allow access to Cloud VM
export TF_VAR_access_bastion_cidr_blocks="[$(dig +short nat.travisci.net | sed -e 's/$/\/32\"/g' | sed -e 's/^/\"/g' | paste -s -d, -)]"
echo "Provisioning Quorum Network"
pushd ${QUORUM_CLOUD_TEMPLATES_DIR}/_terraform_init > /dev/null
${TERRAFORM_CMD} init > /dev/null
echo "----------"
${TERRAFORM_CMD} apply -auto-approve > /dev/null
popd > /dev/null

pushd ${QUORUM_CLOUD_TEMPLATES_DIR} > /dev/null
${TERRAFORM_CMD} init -backend-config=terraform.auto.backend_config > /dev/null
echo "----------"
${TERRAFORM_CMD} apply -auto-approve
if [ $? -ne 0 ]; then
    popd > /dev/null
    ./src/travis/stop_quorum.sh
    exit 1
fi
${TERRAFORM_CMD} output
export private_key_file=$(${TERRAFORM_CMD} output -json | jq -r .private_key_file.value)
export bastion_host_ip=$(${TERRAFORM_CMD} output -json | jq -r .bastion_host_ip.value)
chmod 600 ${private_key_file}
popd > /dev/null

echo "Wait for the Quorum Network being ready"
f="config/application-local.yml"
count=1
while [ "$count" -le 400 ] && [ ! -f ${f} ]; do
    sleep 3
    scp -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=quiet \
        -i ${private_key_file} ec2-user@${bastion_host_ip}:/qdata/quorum_metadata ${f} || echo "Reading metadata...${count}"
    count=$((count+1))
done

if [ ! -f ${f} ]; then
    echo "Timed out!"
    # somehow Travis doesn't fallback to after_script so we explicitly clean up here
     popd > /dev/null
    ./src/travis/stop_quorum.sh
    # we don't do exit 1 here as it will cause issue in Travis, just do a normal and purposedly failed command
    ${TRAVIS_COMMIT} > /dev/null 2>&1
fi

cat ${f}

echo "Start SOCKS proxy for SSH tunnelling"
ssh -D ${QUORUM_SOCKSPROXY_PORT} -N \
    -o ServerAliveInterval=30 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=quiet \
    -i ${private_key_file} ec2-user@${bastion_host_ip} &
