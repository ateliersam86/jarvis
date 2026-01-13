#!/bin/bash
ssh ${JARVIS_SSH_HOST} "cd /mnt/user/websites/jarvis-nexus && docker-compose logs -f jarvis-core"
