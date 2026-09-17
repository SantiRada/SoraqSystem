<?php

declare(strict_types=1);

/*
 * Rate limits: [max attempts, window in seconds].
 * Keep every limit here so they can be tuned without touching module code.
 */
return [
    'login_per_ip' => [20, 900],
    'login_per_account_ip' => [5, 900],
    'register_per_ip' => [5, 3600],
    'project_create_per_user' => [60, 3600],
    'project_members_per_user' => [30, 3600],
    'account_update_per_user' => [10, 3600],
    'account_password_per_user' => [5, 900],
    'account_delete_per_user' => [5, 3600],
    'product_notes_write_per_user' => [300, 3600],
    'context_prompt_generate_per_user' => [20, 3600],
    'card_sort_write_per_user' => [600, 3600],
    'card_sort_share_per_user' => [30, 3600],
    'card_sort_start_per_ip' => [60, 3600],
    'card_sort_submit_per_ip' => [300, 3600],
    'tree_test_write_per_user' => [600, 3600],
    'tree_test_share_per_user' => [30, 3600],
    'tree_test_start_per_ip' => [60, 3600],
    'tree_test_submit_per_ip' => [300, 3600],
];
