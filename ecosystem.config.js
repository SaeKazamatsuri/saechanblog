module.exports = {
    apps: [
        {
            name: 'saechanblog',
            script: 'npm',
            args: 'run start',
            cwd: '/home/koeda_pi/Desktop/saechanblog',
            env: {
                NODE_ENV: 'production',
                LOG_DIR: '/home/koeda_pi/Desktop/saechanblog/log/access',
            },
        },
    ],
}
